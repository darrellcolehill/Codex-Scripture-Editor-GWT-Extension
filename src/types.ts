interface WordData {
    text: string;
    strongs?: string;
    OGNTsort?: string;
}

interface ChapterVerseNumbers {
    chapter: number;
    verse: number;
}

export type { WordData, ChapterVerseNumbers }