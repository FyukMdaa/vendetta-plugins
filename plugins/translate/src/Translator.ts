/**
 * Translator module for Google Translate API
 * Ported from Aliucord's Translator.kt
 */

export class Translator {
    private static readonly GOOGLE_TRANSLATE_URL = "https://translate.googleapis.com/translate_a/single";

    /**
     * Translate text to target language using Google Translate API
     * @param text Text to translate
     * @param targetLang Target language code (e.g., 'ja', 'en')
     * @returns Translated text
     */
    static async translate(text: string, targetLang: string): Promise<string> {
        try {
            const encodedText = encodeURIComponent(text);
            const urlParams = new URLSearchParams({
                client: "gtx",
                sl: "auto",
                tl: targetLang,
                dt: "t",
                q: encodedText,
            });

            const url = `${this.GOOGLE_TRANSLATE_URL}?${urlParams.toString()}`;

            const response = await fetch(url, {
                method: "GET",
                headers: {
                    "User-Agent": "Mozilla/5.0",
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const body = await response.text();
            return this.parseResponse(body);
        } catch (error) {
            console.error("Translation failed:", error);
            throw error;
        }
    }

    /**
     * Parse Google Translate API response
     * @param body Response body from API
     * @returns Translated text
     */
    private static parseResponse(body: string): string {
        try {
            const pattern = /\["((?:[^"\\]|\\.)*)",/g;
            const result: string[] = [];
            let match;

            while ((match = pattern.exec(body)) !== null) {
                const part = match[1];

                // Filter out metadata (32-char hex hash)
                if (/^[a-f0-9]{32}$/.test(part)) {
                    continue;
                }

                // Only include parts with length >= 3
                if (part.length >= 3) {
                    result.push(this.unescapeJsonString(part));
                }
            }

            if (result.length === 0) {
                throw new Error("No translation found");
            }

            return result.join("");
        } catch (error) {
            console.error("Parsing error:", error);
            throw error;
        }
    }

    /**
     * Unescape JSON string
     * @param str JSON string to unescape
     * @returns Unescaped string
     */
    private static unescapeJsonString(str: string): string {
        return str
            .replace(/\\"/g, '"')
            .replace(/\\\//g, "/")
            .replace(/\\\\/g, "\\")
            .replace(/\\n/g, "\n")
            .replace(/\\r/g, "\r")
            .replace(/\\t/g, "\t");
    }
}
