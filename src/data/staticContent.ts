
import { VocabItem, Question } from '../../types';

// --- TYPES FOR STATIC CONTENT ---
export interface StaticArticle {
    id: string;
    title: string;
    category: string;
    level: string;
    content: string; 
    summary: string; 
    words: VocabItem[]; 
}

export interface StaticListening {
    id: string;
    title: string;
    level: string;
    duration: string; 
    audioSrc: string; 
    script: string;
    questions: Question[];
}

export interface StaticGrammar {
    id: string;
    title: string;
    level: string;
    summary: string;
    content: {
        rule: string;
        examples: { correct: string; incorrect: string; explanation: string }[];
        tips: string[];
    }
}

export interface StaticVocabList {
    id: string;
    topic: string;
    level: string;
    words: VocabItem[];
}

export interface ResourcePack {
    id: string;
    title: string;
    description: string;
    category: string; // Changed to string to allow flexible categories like 'Series'
    coverColor: string; // Tailwind class
    items: {
        label: string; 
        type: 'pdf' | 'audio' | 'zip';
        size: string;
        url: string; // PASTE YOUR DRIVE LINKS HERE
    }[];
}

// --- CONTENT DATABASE ---

// NOTE: You must replace "PASTE_LINK_HERE" with the actual Google Drive Share Links 
// for the individual files you uploaded.

export const STATIC_RESOURCE_PACKS: ResourcePack[] = [
    {
        id: "efe_lvl1",
        title: "English for Everyone: Level 1 (Beginner)",
        description: "The starting point. Introduces topics such as jobs and routines, leisure activities, and the home. Essential for A1 learners.",
        category: "Complete Series",
        coverColor: "bg-orange-500",
        items: [
            { label: "Course Book (PDF)", type: 'pdf', size: 'Unknown', url: '#' },
            { label: "Practice Book (PDF)", type: 'pdf', size: 'Unknown', url: '#' },
            { label: "Level 1 Audio Files", type: 'audio', size: 'Unknown', url: '#' }
        ]
    },
    {
        id: "efe_lvl2",
        title: "English for Everyone: Level 2 (Beginner)",
        description: "Expands on Level 1. Covers emotions, actions, and activities, as well as numbers, dates, and months. A2 level.",
        category: "Complete Series",
        coverColor: "bg-orange-600",
        items: [
            { label: "Course Book (PDF)", type: 'pdf', size: 'Unknown', url: '#' },
            { label: "Practice Book (PDF)", type: 'pdf', size: 'Unknown', url: '#' },
            { label: "Level 2 Audio Files", type: 'audio', size: 'Unknown', url: '#' }
        ]
    },
    {
        id: "efe_lvl3",
        title: "English for Everyone: Level 3 (Intermediate)",
        description: "Detailed intermediate course. Topics include skills, vocabulary, and grammar needed for B1-B2 level proficiency.",
        category: "Complete Series",
        coverColor: "bg-green-600",
        items: [
            { label: "Course Book (PDF)", type: 'pdf', size: 'Unknown', url: '#' },
            { label: "Practice Book (PDF)", type: 'pdf', size: 'Unknown', url: '#' },
            { label: "Level 3 Audio Files", type: 'audio', size: 'Unknown', url: '#' }
        ]
    },
    {
        id: "efe_lvl4",
        title: "English for Everyone: Level 4 (Advanced)",
        description: "The highest level. Covers complex grammar, nuanced vocabulary, and professional topics for C1 learners.",
        category: "Complete Series",
        coverColor: "bg-blue-600",
        items: [
            { label: "Course Book (PDF)", type: 'pdf', size: 'Unknown', url: '#' },
            { label: "Practice Book (PDF)", type: 'pdf', size: 'Unknown', url: '#' },
            { label: "Level 4 Audio Files", type: 'audio', size: 'Unknown', url: '#' }
        ]
    },
    {
        id: "efe_grammar",
        title: "English for Everyone: Grammar Guide",
        description: "A comprehensive visual reference guide to English grammar. Puts the entire language in a simple, visual format.",
        category: "Reference",
        coverColor: "bg-red-600",
        items: [
            { label: "Grammar Guide (PDF)", type: 'pdf', size: 'Unknown', url: '#' },
            { label: "Practice Book (PDF)", type: 'pdf', size: 'Unknown', url: '#' }
        ]
    },
    {
        id: "efe_business",
        title: "English for Everyone: Business English",
        description: "Essential for professionals. Covers phone calls, emails, meetings, and negotiations.",
        category: "Specialized",
        coverColor: "bg-slate-700",
        items: [
            { label: "Course Book (Level 1)", type: 'pdf', size: 'Unknown', url: '#' },
            { label: "Course Book (Level 2)", type: 'pdf', size: 'Unknown', url: '#' },
            { label: "Business Audio Files", type: 'audio', size: 'Unknown', url: '#' }
        ]
    }
];

export const STATIC_READING: StaticArticle[] = [
    {
        id: "read_001",
        title: "The Impact of Urbanization on Biodiversity",
        category: "Environment",
        level: "C1",
        summary: "An academic look at how expanding cities affect local ecosystems and wildlife corridors.",
        content: `Urbanization represents one of the most significant land-use changes globally, profoundly altering natural landscapes and biodiversity. As cities expand to accommodate growing populations, natural habitats are fragmented, degraded, or completely replaced by impervious surfaces such as roads and buildings. This transformation poses a dual challenge: maintaining urban functionality while preserving the ecological integrity necessary for biodiversity.

One of the primary consequences of urbanization is habitat fragmentation. Continuous tracts of land are broken into smaller, isolated patches, preventing species from moving freely to find food, mates, or new territories. This isolation can lead to a decrease in genetic diversity, making populations more vulnerable to disease and environmental changes. For instance, studies have shown that ground-dwelling mammals in urban areas often exhibit lower genetic variation compared to their rural counterparts.

Furthermore, the 'urban heat island' effect exacerbates these challenges. Cities, with their abundance of concrete and asphalt, absorb and retain heat, leading to higher temperatures than surrounding rural areas. This shift can disrupt the phenology of plants and animals—altering migration patterns, breeding seasons, and flowering times. Species unable to adapt to these rapid thermal changes face the risk of local extinction.

However, urban environments are not devoid of potential for conservation. The concept of 'reconciliation ecology' suggests that cities can be designed to harbor significant biodiversity. Green roofs, vertical gardens, and interconnected park systems can serve as vital corridors for wildlife. By integrating green infrastructure into urban planning, cities can mitigate the adverse effects of fragmentation and provide refuge for a variety of species, from pollinators to migratory birds.`,
        words: [
            { word: "fragmentation", pos: "noun", meaning: "the process or state of breaking or being broken into small or separate parts.", example: "Habitat fragmentation is a leading cause of species decline." },
            { word: "impervious", pos: "adj", meaning: "not allowing fluid to pass through.", example: "Impervious surfaces like concrete prevent rainwater from soaking into the ground." },
            { word: "phenology", pos: "noun", meaning: "the study of cyclic and seasonal natural phenomena.", example: "Climate change is altering the phenology of many plant species." },
            { word: "mitigate", pos: "verb", meaning: "make less severe, serious, or painful.", example: "Green roofs help mitigate the urban heat island effect." }
        ]
    },
    {
        id: "read_002",
        title: "The Psychology of Color in Marketing",
        category: "Business",
        level: "B2",
        summary: "How brands use color theory to influence consumer behavior and perception.",
        content: `Color is a powerful communication tool and can be used to signal action, influence mood, and even cause physiological reactions. In marketing, color is often the first thing a consumer notices about a brand, and it plays a pivotal role in shaping brand perception.

Red, for example, is associated with energy, urgency, and excitement. It is frequently used in clearance sales to stimulate impulse buying or by fast-food chains to stimulate appetite. In contrast, blue evokes feelings of trust, security, and dependability, which is why it is the dominant color for financial institutions and technology companies.

However, the impact of color is not universal; it is deeply rooted in cultural contexts. While white represents purity and weddings in many Western cultures, it is the color of mourning in parts of Asia. Global brands must therefore navigate these cultural nuances carefully when launching products in international markets.`,
        words: [
            { word: "pivotal", pos: "adj", meaning: "of crucial importance in relation to the development or success of something else.", example: "Customer service plays a pivotal role in retention." },
            { word: "evoke", pos: "verb", meaning: "bring or recall to the conscious mind.", example: "The aroma of coffee evokes memories of morning routines." },
            { word: "nuance", pos: "noun", meaning: "a subtle difference in or shade of meaning, expression, or sound.", example: "Understanding cultural nuances is key to global marketing." }
        ]
    }
];

export const STATIC_GRAMMAR: StaticGrammar[] = [
    {
        id: "gram_001",
        title: "Present Perfect vs. Past Simple",
        level: "B1-B2",
        summary: "The definitive guide to understanding when to use 'have done' versus 'did'.",
        content: {
            rule: "Use Past Simple for finished actions at a specific time in the past. Use Present Perfect for actions that happened at an unspecified time or have a connection to the present.",
            examples: [
                { correct: "I have lost my keys. (I can't find them now)", incorrect: "I lost my keys. (implies I might have found them, or talking about a past event)", explanation: "Present Perfect focuses on the result in the present." },
                { correct: "I lived in Paris in 2010.", incorrect: "I have lived in Paris in 2010.", explanation: "We cannot use specific past time markers (in 2010, yesterday) with Present Perfect." }
            ],
            tips: [
                "Key words for Past Simple: yesterday, last week, in 1999, ago.",
                "Key words for Present Perfect: just, already, yet, ever, never, since, for.",
                "If the time period is finished (e.g., 'this morning' when it is now afternoon), use Past Simple."
            ]
        }
    },
    {
        id: "gram_002",
        title: "Articles: A, An, The",
        level: "A2-B1",
        summary: "Mastering the definite and indefinite articles in English.",
        content: {
            rule: "Use 'A/An' for non-specific, singular countable nouns. Use 'The' for specific nouns that both the speaker and listener know.",
            examples: [
                { correct: "I saw a dog. The dog was barking.", incorrect: "I saw the dog. A dog was barking.", explanation: "First mention is usually 'a' (indefinite). Second mention is 'the' (definite)." },
                { correct: "She is a doctor.", incorrect: "She is doctor.", explanation: "Professions always take an article in English." }
            ],
            tips: [
                "No article is used for plural generalizations (e.g., 'Cats are independent').",
                "Use 'The' for unique things (The sun, The internet).",
                "Use 'The' with superlatives (The best, The biggest)."
            ]
        }
    }
];

export const STATIC_VOCAB: StaticVocabList[] = [
    {
        id: "voc_001",
        topic: "Environmental Science",
        level: "C1",
        words: [
            { word: "biodegradable", pos: "adj", meaning: "capable of being decomposed by bacteria or other living organisms.", example: "We should switch to biodegradable packaging." },
            { word: "carbon footprint", pos: "noun", meaning: "the amount of carbon dioxide and other carbon compounds emitted due to the consumption of fossil fuels by a particular person, group, etc.", example: "Flying increases your carbon footprint significantly." },
            { word: "sustainable", pos: "adj", meaning: "able to be maintained at a certain rate or level without depleting natural resources.", example: "Sustainable agriculture is vital for the future." },
            { word: "conservation", pos: "noun", meaning: "prevention of wasteful use of a resource.", example: "Water conservation is critical during a drought." },
            { word: "ecosystem", pos: "noun", meaning: "a biological community of interacting organisms and their physical environment.", example: "The coral reef ecosystem is fragile." }
        ]
    }
];

export const STATIC_LISTENING: StaticListening[] = [
    {
        id: "list_001",
        title: "University Campus Tour",
        level: "B1",
        duration: "3:45",
        audioSrc: "/audio/campus_tour.mp3", // User needs to add this file
        script: "Guide: Welcome everyone to the University of Oxford. We are currently standing in front of the Bodleian Library, one of the oldest libraries in Europe... [Audio file required for full experience]",
        questions: [
            { id: "q1", type: "mcq", prompt: "Where does the tour start?", options: ["The Library", "The Cafeteria", "The Dorms"], answer: "The Library", explanation: "The guide explicitly states they are standing in front of the Bodleian Library." }
        ]
    }
];
