import { getAPISchemas, isBit } from "@/content/api-reference";
import type { APISchema } from "@/types";
import { error, redirect } from "@sveltejs/kit";
import type { Doc } from "contentlayer/generated";

export type FrontMatter = Pick<Doc, "title" | "description">;

export type DocFile = {
	default: import("svelte").SvelteComponent;
	metadata: FrontMatter;
};

export type DocResolver = () => Promise<DocFile>;

type TDoc = {
	component: DocFile["default"];
	metadata: DocFile["metadata"];
	title: string;
};

type ComponentDoc = {
	component: DocFile["default"];
	metadata: DocFile["metadata"];
	title: DocFile["metadata"]["title"];
	schemas: APISchema[];
};

export function slugFromPath(path: string) {
	return path.replace("/content/", "").replace(".md", "");
}

export async function getDoc(slug: string): Promise<TDoc> {
	if (slug === "components") {
		throw redirect(303, "/docs/components/accordion");
	}

	const modules = import.meta.glob(`/content/**/*.md`);

	let match: { path?: string; resolver?: DocResolver } = {};

	for (const [path, resolver] of Object.entries(modules)) {
		if (slugFromPath(path) === slug) {
			match = { path, resolver: resolver as unknown as DocResolver };
			break;
		}
	}

	const doc = await match?.resolver?.();

	if (!doc || !doc.metadata) {
		throw error(404);
	}

	return {
		component: doc.default,
		metadata: doc.metadata,
		title: doc.metadata.title
	};
}

export async function getComponentDoc(slug: string): Promise<ComponentDoc> {
	if (slug === "components") {
		throw redirect(303, "/docs/components/accordion");
	}

	if (!isBit(slug)) {
		throw error(404);
	}

	const modules = import.meta.glob("/content/**/*.md");

	let match: { path?: string; resolver?: DocResolver } = {};

	for (const [path, resolver] of Object.entries(modules)) {
		if (slugFromPath(path).replace("components/", "") === slug) {
			match = { path, resolver: resolver as unknown as DocResolver };
			break;
		}
	}

	const doc = await match?.resolver?.();
	if (!doc || !doc.metadata) {
		throw error(404);
	}

	return {
		component: doc.default,
		metadata: doc.metadata,
		title: doc.metadata.title,
		schemas: getAPISchemas(slug)
	};
}