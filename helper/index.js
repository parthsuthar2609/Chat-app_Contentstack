import Stack from "../contentstack-sdk";
import { addEditableTags } from "@contentstack/utils";

const liveEdit = process.env.CONTENTSTACK_LIVE_EDIT_TAGS === "true";

export const getHeaderRes = async () => {
    const response = await Stack.getEntry({
        contentTypeUid: "header",
        referenceFieldPath: ["navigation_menu.page_reference"],
        jsonRtePath: ["notification_bar.announcement_text"],
    });

    liveEdit && addEditableTags(response[0][0], "header", true);
    return response[0][0];
};

export const getFooterRes = async () => {
    const response = await Stack.getEntry({
        contentTypeUid: "footer",
        referenceFieldPath: undefined,
        jsonRtePath: ["copyright"],
    });
    liveEdit && addEditableTags(response[0][0], "footer", true);
    return response[0][0];
};

export const getAllEntries = async () => {
    const response = await Stack.getEntry({
        contentTypeUid: "page",
        referenceFieldPath: undefined,
        jsonRtePath: undefined,
    });
    liveEdit &&
        response[0].forEach((entry) => addEditableTags(entry, "page", true));
    return response[0];
};

export const getHomePageRes = async () => {
    const response = await getEntryByUrlGQL({
        contentTypeUid: "page",
        entryUrl: "/",
        jsonRtePath: [
            "page_components.from_blog.featured_blogs.body",
            "page_components.section_with_buckets.buckets.description",
            "page_components.section_with_html_code.description",
        ]
    })
    liveEdit && addEditableTags(response[0][0], "page", true);
    return response[0][0];
}

const entryUrlMatches = (urlField, entryUrl) => {
    if (!urlField || !entryUrl) return false;
    const target = entryUrl.startsWith("/") ? entryUrl : `/${entryUrl}`;
    const candidates = [];
    if (typeof urlField === "string") {
        candidates.push(urlField);
    } else if (typeof urlField === "object") {
        if (urlField.href) candidates.push(urlField.href);
        if (urlField.url) candidates.push(urlField.url);
    }
    return candidates.some((value) => {
        const path = typeof value === "string" ? value : "";
        const normalized = path.startsWith("/") ? path : `/${path}`;
        return normalized === target || path === entryUrl;
    });
};

const pickEntry = (response) => {
    if (!response) return undefined;
    if (Array.isArray(response)) return response[0]?.uid ? response[0] : undefined;
    return response.uid ? response : undefined;
};

const ICON_CARDS_RTE_PATHS = [
    "page_component.icon_cards.description",
    "page_component.icon_cards.icon_card.description",
    "page_component.icon_card.description",
    "page_component.icon_card.icon_card.description",
    "page_components.icon_cards.description",
    "page_components.icon_cards.icon_card.description",
    "page_components.icon_card.description",
    "page_components.icon_card.icon_card.description",
];

const SERVICES_CONTENT_TYPE_UIDS = [
    process.env.CONTENTSTACK_SERVICES_CONTENT_TYPE_UID,
    "services",
    "multiple_content_type",
].filter(Boolean);

/** Map CMS block UID variants → icon_cards for the renderer */
const normalizeModularBlock = (block) => {
    if (!block || typeof block !== "object") return block;
    if (block.icon_card && !block.icon_cards) {
        return { icon_cards: block.icon_card };
    }
    return block;
};

export const getPageComponentsFromEntry = (entry) => {
    const raw = entry?.page_components ?? entry?.page_component;
    if (!Array.isArray(raw)) return raw;
    return raw.map(normalizeModularBlock);
};

const safeGetEntryByUrl = async (options) => {
    try {
        return pickEntry(await Stack.getEntryByUrl(options));
    } catch {
        return undefined;
    }
};

export const getServicesPageRes = async (entryUrl) => {
    try {
        for (const contentTypeUid of SERVICES_CONTENT_TYPE_UIDS) {
            const queryOpts = {
                contentTypeUid,
                entryUrl,
                referenceFieldPath: undefined,
                jsonRtePath: ICON_CARDS_RTE_PATHS,
            };

            let entry =
                (await safeGetEntryByUrl(queryOpts)) ||
                (await safeGetEntryByUrl({
                    ...queryOpts,
                    urlField: "url.href",
                }));

            if (!entry) {
                try {
                    const allResponse = await Stack.getEntry({
                        contentTypeUid,
                        referenceFieldPath: undefined,
                        jsonRtePath: ICON_CARDS_RTE_PATHS,
                    });
                    const entries = allResponse?.[0] ?? [];
                    entry = entries.find((item) =>
                        entryUrlMatches(item.url, entryUrl),
                    );
                } catch {
                    entry = undefined;
                }
            }

            if (entry) {
                liveEdit && addEditableTags(entry, contentTypeUid, true);
                return entry;
            }
        }

        return undefined;
    } catch (error) {
        console.error("[Contentstack] Services entry fetch failed:", error);
        return undefined;
    }
};

export const getPageRes = async (entryUrl) => {
    try {
        const response = await Stack.getEntryByUrl({
            contentTypeUid: "page",
            entryUrl,
            referenceFieldPath: [
                "page_components.from_blog.featured_blogs",
                "page_components.superheroes.character",
            ],
            jsonRtePath: [
                "page_components.from_blog.featured_blogs.body",
                "page_components.section_with_buckets.buckets.description",
                "page_components.section_with_html_code.description",
                ...ICON_CARDS_RTE_PATHS,
            ],
        });
        const entry = pickEntry(response);
        if (!entry) return undefined;
        liveEdit && addEditableTags(entry, "page", true);
        return entry;
    } catch (error) {
        const err = error;
        console.error(
            "[Contentstack] Page fetch failed:",
            err?.error_message || error,
            err?.error_code ? `(code ${err.error_code})` : "",
            { entryUrl },
        );
        return undefined;
    }
};

export const getBlogListRes = async () => {
    const response = await Stack.getEntry({
        contentTypeUid: "blog_post",
        referenceFieldPath: ["author", "related_post"],
        jsonRtePath: ["body"],
    });
    liveEdit &&
        response[0].forEach((entry) => addEditableTags(entry, "blog_post", true));
    return response[0];
};

export const getBlogPostRes = async (entryUrl) => {
    const response = await Stack.getEntryByUrl({
        contentTypeUid: "blog_post",
        entryUrl,
        referenceFieldPath: ["author", "related_post"],
        jsonRtePath: ["body", "related_post.body"],
    });
    const entry = pickEntry(response);
    if (!entry) return undefined;
    liveEdit && addEditableTags(entry, "blog_post", true);
    return entry;
};

export const getAllComposableHeros = async (entryUrl) => {
    const response = await Stack.getEntryByUrl({
        contentTypeUid: "superhero_gallery_page",
        entryUrl,
        referenceFieldPath: ["characters"],
        jsonRtePath: ["characters.description"],
    });
    const entry = pickEntry(response);
    if (!entry) return undefined;
    liveEdit && addEditableTags(entry, "superhero_gallery_page", true);
    return entry;
};

export const getComposableHeroHomeWorld = async () => {
    const response = await Stack.getEntry({
        contentTypeUid: "character",
        // referenceFieldPath: ["home_world"],
        jsonRtePath: ["description"],
    });
    liveEdit &&
        response[0].forEach((entry) => addEditableTags(entry, "character", true));
    return response;
};

export const getComposableHeroSingleRes = async (entryUrl) => {
    const response = await Stack.getEntryByUrl({
        contentTypeUid: "character",
        entryUrl,
        referenceFieldPath: ["home_world"],
        jsonRtePath: ["description"],
    });
    const entry = pickEntry(response);
    if (!entry) return undefined;
    liveEdit && addEditableTags(entry, "character", true);
    return entry;
};

export const getComposableHeroGallery = async (entryUrl) => {
    const response = await Stack.getEntryByUrl({
        contentTypeUid: "superhero_landing_page",
        entryUrl,
        referenceFieldPath: ["modular_blocks.super_heroes_gallery.heroes"],
        jsonRtePath: ["modular_blocks.super_heroes_gallery.description"],
    });
    const entry = pickEntry(response);
    if (!entry) return undefined;
    liveEdit && addEditableTags(entry, "superhero_landing_page", true);
    return entry;
};

const AI_ASSISTANT_RTE_PATHS = [
    "page_components.ai_assistant.hero_description",
    "page_component.ai_assistant.hero_description",
];

const collectTechStacksFromBlock = (block) => {
    const raw = block?.tech_stacks ?? block?.tech_stack;
    if (!raw) return [];
    return Array.isArray(raw) ? raw : [raw];
};

/** Pull ai_assistant modular block data from a Page (or Services) entry */
export const extractAiAssistantData = (entry) => {
    if (!entry) return undefined;

    const components = entry.page_components ?? entry.page_component ?? [];
    const blocks = components.map((c) => c.ai_assistant).filter(Boolean);
    if (!blocks.length) return undefined;

    const techStacks = blocks.flatMap(collectTechStacksFromBlock);
    const first = blocks[0];

    return {
        uid: entry.uid,
        locale: entry.locale,
        title: entry.title,
        url: entry.url,
        hero_title: first.hero_title || entry.title,
        hero_description: first.hero_description || entry.description,
        tech_stack: techStacks,
        seo: entry.seo,
        $: first.$,
    };
};

export const getAiAssistantPageRes = async (entryUrl = "/ai-assistant") => {
    try {
        const response = await Stack.getEntryByUrl({
            contentTypeUid: "page",
            entryUrl,
            referenceFieldPath: undefined,
            jsonRtePath: AI_ASSISTANT_RTE_PATHS,
        });
        let entry = pickEntry(response);

        if (!entry) {
            entry = await safeGetEntryByUrl({
                contentTypeUid: "page",
                entryUrl,
                urlField: "url.href",
                referenceFieldPath: undefined,
                jsonRtePath: AI_ASSISTANT_RTE_PATHS,
            });
        }

        if (!entry) return undefined;

        liveEdit && addEditableTags(entry, "page", true);

        const data = extractAiAssistantData(entry);
        if (!data) return undefined;

        return data;
    } catch (error) {
        console.error(
            "[Contentstack] AI Assistant fetch failed:",
            error?.error_message || error,
            { entryUrl },
        );
        return undefined;
    }
};

export const getSuperheroGalleryRes = async () => {
    const response = await Stack.getEntry({
        contentTypeUid: "character",
        jsonRtePath: ["description"],
    });

    liveEdit &&
        response[0].forEach((entry) => addEditableTags(entry, "character", true));
    return response;
};

export const metaData = (seo) => {
    const metaArr = [];
    for (const key in seo) {
        if (seo.enable_search_indexing) {
            metaArr.push(
                <meta
                    name={
                        key.includes('meta_')
                            ? key.split('meta_')[1].toString()
                            : key.toString()
                    }
                    content={seo[key].toString()}
                    key={key}
                />
            );
        }
    }
    return metaArr;
};