import { logger } from "@vendetta";
import { patcher } from "@vendetta/patcher";
import { storage } from "@vendetta/plugin";
import { findByProps, findByDisplayName } from "@vendetta/metro";
import Settings from "./Settings";
import { Translator } from "./Translator";

// Types
interface TranslatedEntry {
    original: string;
    translated: string;
    showingTranslation: boolean;
}

// State management
const translatedMessages = new Map<string, TranslatedEntry>();
const autoChannels = new Set<string>();
const translatingIds = new Set<string>();

// Discord tag pattern (mentions, channels, emojis)
const DISCORD_TAG_PATTERN = /<(?:a?:\w+:\d+|@&?\d+|#\d+|@!?\d+)>/g;

function targetLang(): string {
    return storage.targetLang ?? "ja";
}

function showOriginal(): boolean {
    return storage.showOriginal ?? true;
}

function isBlankSafe(str: string): boolean {
    return str.trim().length === 0;
}

/**
 * Replace Discord tags with placeholders for translation
 */
function replaceTagsWithPlaceholders(
    content: string
): { processed: string; tags: string[] } {
    const tags: string[] = [];
    let processed = content;
    let match;
    const regex = new RegExp(DISCORD_TAG_PATTERN);

    while ((match = regex.exec(content)) !== null) {
        tags.push(match[0]);
        processed = processed.replace(match[0], ` __TAG_${tags.length - 1}__ `);
    }

    return { processed, tags };
}

/**
 * Restore Discord tags from placeholders
 */
function restoreTagsFromPlaceholders(
    content: string,
    tags: string[]
): string {
    let result = content;
    for (let i = 0; i < tags.length; i++) {
        const placeholderPattern = new RegExp(`\\s*__TAG_${i}__\\s*`, "g");
        result = result.replace(placeholderPattern, tags[i]);
    }
    return result;
}

/**
 * Translate message content asynchronously
 */
async function translateAsync(
    messageId: string,
    content: string,
    lang: string,
    onComplete?: () => void
): Promise<void> {
    if (translatingIds.has(messageId)) return;

    translatingIds.add(messageId);
    try {
        const { processed, tags } = replaceTagsWithPlaceholders(content);

        let result = await Translator.translate(processed, lang);

        if (result) {
            result = restoreTagsFromPlaceholders(result, tags);

            // Clean up escaped characters
            result = result
                .replace(/\\u003c/g, "<")
                .replace(/\\u003e/g, ">");

            // Check if translation is different from original
            if (!result.trim().toLowerCase().includes(content.trim().toLowerCase())) {
                translatedMessages.set(messageId, {
                    original: content,
                    translated: result,
                    showingTranslation: true,
                });
                onComplete?.();
            }
        }
    } catch (error) {
        logger.error("Translation failed:", error);
    } finally {
        translatingIds.delete(messageId);
    }
}

export default {
    onLoad: () => {
        logger.log("Translate Plugin loaded");

        try {
            // Find the Message component
            const MessageModule = findByProps("getContent");
            if (!MessageModule) {
                logger.warn("Could not find Message module");
                return;
            }

            // Patch Message.getContent to show translations
            const unpatchGetContent = patcher.instead(
                MessageModule,
                "getContent",
                function (args, original) {
                    try {
                        const message = this;
                        const entry = translatedMessages.get(message.id);

                        if (
                            entry &&
                            entry.showingTranslation
                        ) {
                            const display = showOriginal()
                                ? `${entry.original}\n---\n${entry.translated}`
                                : entry.translated;
                            return display;
                        }

                        return original.apply(this, args);
                    } catch (error) {
                        logger.error("Error in getContent patch:", error);
                        return original.apply(this, args);
                    }
                }
            );

            // Find ActionSheet or message context menu module
            const ActionSheetModule = findByDisplayName("ActionSheetRow");
            if (!ActionSheetModule) {
                logger.warn("Could not find ActionSheet module");
                return;
            }

            // Store unpatch functions for cleanup
            const patches = [unpatchGetContent];

            // Return cleanup function
            return () => {
                patches.forEach((unpatch) => unpatch?.());
            };
        } catch (error) {
            logger.error("Failed to initialize Translate Plugin:", error);
        }
    },

    onUnload: () => {
        logger.log("Translate Plugin unloaded");
        translatedMessages.clear();
        autoChannels.clear();
        translatingIds.clear();
    },

    settings: Settings,
};
