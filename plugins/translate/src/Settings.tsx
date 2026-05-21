import React, { useState, useMemo } from "react";
import { Forms, Pressable } from "@vendetta/ui/components";
import { storage } from "@vendetta/plugin";

const { FormText, FormInput, FormSwitch, FormSection } = Forms;

// Supported languages (display name to code)
const ALL_LANGUAGES = [
    ["Afrikaans", "af"],
    ["Albanian", "sq"],
    ["Amharic", "am"],
    ["Arabic", "ar"],
    ["Armenian", "hy"],
    ["Assamese", "as"],
    ["Azerbaijani", "az"],
    ["Basque", "eu"],
    ["Bengali", "bn"],
    ["Bulgarian", "bg"],
    ["Burmese", "my"],
    ["Catalan", "ca"],
    ["Cherokee", "chr"],
    ["Chinese (Hong Kong)", "zh-HK"],
    ["Chinese (Simplified)", "zh-CN"],
    ["Chinese (Traditional)", "zh-TW"],
    ["Croatian", "hr"],
    ["Czech", "cs"],
    ["Danish", "da"],
    ["Dutch", "nl"],
    ["English (UK)", "en-GB"],
    ["English (US)", "en"],
    ["Estonian", "et"],
    ["Filipino", "fil"],
    ["Finnish", "fi"],
    ["French", "fr"],
    ["French (Canada)", "fr-CA"],
    ["Galician", "gl"],
    ["Georgian", "ka"],
    ["German", "de"],
    ["Greek", "el"],
    ["Gujarati", "gu"],
    ["Hebrew", "iw"],
    ["Hindi", "hi"],
    ["Hungarian", "hu"],
    ["Icelandic", "is"],
    ["Indonesian", "id"],
    ["Irish", "ga"],
    ["Italian", "it"],
    ["Japanese", "ja"],
    ["Kannada", "kn"],
    ["Kazakh", "kk"],
    ["Khmer", "km"],
    ["Korean", "ko"],
    ["Lao", "lo"],
    ["Latvian", "lv"],
    ["Lithuanian", "lt"],
    ["Macedonian", "mk"],
    ["Malay", "ms"],
    ["Malayalam", "ml"],
    ["Marathi", "mr"],
    ["Mongolian", "mn"],
    ["Nepali", "ne"],
    ["Norwegian", "no"],
    ["Oriya", "or"],
    ["Persian", "fa"],
    ["Polish", "pl"],
    ["Portuguese (Brazil)", "pt-BR"],
    ["Portuguese (Portugal)", "pt-PT"],
    ["Punjabi", "pa"],
    ["Romanian", "ro"],
    ["Russian", "ru"],
    ["Serbian", "sr"],
    ["Sinhala", "si"],
    ["Slovak", "sk"],
    ["Slovenian", "sl"],
    ["Spanish", "es"],
    ["Spanish (Latin America)", "es-419"],
    ["Swahili", "sw"],
    ["Swedish", "sv"],
    ["Tamil", "ta"],
    ["Telugu", "te"],
    ["Thai", "th"],
    ["Turkish", "tr"],
    ["Ukrainian", "uk"],
    ["Urdu", "ur"],
    ["Uzbek", "uz"],
    ["Vietnamese", "vi"],
    ["Welsh", "cy"],
    ["Zulu", "zu"],
] as const;

function getLanguageName(code: string): string {
    const lang = ALL_LANGUAGES.find(([_, c]) => c === code);
    return lang ? lang[0] : `Unknown (${code})`;
}

export default function Settings() {
    const [targetLang, setTargetLang] = useState(
        storage.targetLang ?? "ja"
    );
    const [showOriginal, setShowOriginal] = useState(
        storage.showOriginal ?? true
    );
    const [searchQuery, setSearchQuery] = useState("");

    const filteredLanguages = useMemo(() => {
        if (!searchQuery) return ALL_LANGUAGES;
        const query = searchQuery.toLowerCase();
        return ALL_LANGUAGES.filter(
            ([name, code]) =>
                name.toLowerCase().includes(query) ||
                code.toLowerCase().includes(query)
        );
    }, [searchQuery]);

    const handleLanguageSelect = (code: string) => {
        storage.targetLang = code;
        setTargetLang(code);
    };

    const handleShowOriginalChange = (value: boolean) => {
        storage.showOriginal = value;
        setShowOriginal(value);
    };

    return (
        <>
            <FormSection title="Translation Settings">
                <FormText>
                    Target Language: {getLanguageName(targetLang)} [{targetLang}]
                </FormText>
                <FormInput
                    placeholder="Search language..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                <FormText style={{ marginTop: 10, marginBottom: 10 }}>
                    Available Languages:
                </FormText>
                {filteredLanguages.map(([name, code]) => (
                    <Pressable
                        key={code}
                        onPress={() => handleLanguageSelect(code)}
                        style={{
                            padding: 10,
                            marginVertical: 4,
                            backgroundColor:
                                code === targetLang ? "#5865F2" : "#2C2F33",
                            borderRadius: 4,
                        }}
                    >
                        <FormText>
                            {name} ({code})
                        </FormText>
                    </Pressable>
                ))}
            </FormSection>

            <FormSection title="Display Options">
                <FormSwitch
                    label="Show original text with translation"
                    value={showOriginal}
                    onValueChange={handleShowOriginalChange}
                />
            </FormSection>
        </>
    );
}
