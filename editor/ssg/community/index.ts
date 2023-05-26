import fs from "fs";
import path from "path";

export type FigmaCommunityFileId = string;
export type FigmaCommunityPublisherId = string;

export interface FigmaCommunityFileQueryParams {
  page?: number;
  limit?: number;
  q?: string;
  tag?: string;
}

export interface FigmaCommunityFileMeta {
  id: FigmaCommunityFileId;
  name: string;
  description: string;
  version_id: string;
  version: string;
  created_at: string;
  duplicate_count: number;
  like_count: number;
  thumbnail_url: string;
  community_publishers: FigmaCommunityPublisherId[];
  publisher: {
    id: FigmaCommunityPublisherId;
    name: string;
    img_url: string;
    badges: ReadonlyArray<"figma_partner" | unknown>;
    primary_user_id: string;
    profile_handle: string;
    follower_count: number;
    following_count: number;
  };
  support_contact: string;
  creator: {
    id: string;
    handle: string;
    img_url: string;
  };
  tags: string[];
  related_content: {
    content: FigmaCommunityFileId[];
    type: "by_creator" | "by_remixes";
  };
}

export interface FigmaCommunityFileRelatedContentMeta {
  id: FigmaCommunityFileId;
  name: string;
  thumbnail_url: string;
  creator: {
    id: string;
    handle: string;
    img_url: string;
  };
  like_count: number;
  duplicate_count: number;
}

function read_meta_file(): ReadonlyArray<FigmaCommunityFileMeta> {
  // read meta.json from data/figma-archives/meta.json
  const meta = JSON.parse(
    fs.readFileSync(
      path.join(process.cwd(), "../data/figma-archives/prod/meta.json"),
      "utf-8"
    )
  );

  return meta;
}

function shorten_description(description: string, length: number = 64) {
  if (!description) return null;
  // 1. parse & remove html tags
  const plain = description.replace(/<[^>]*>?/gm, "");
  // 2. shorten to length
  // 3. add ... if needed
  return plain.slice(0, length) + "...";
}

function minify(
  ...files: FigmaCommunityFileMeta[]
): ReadonlyArray<Partial<FigmaCommunityFileMeta>> {
  return files.map((meta) => {
    return {
      id: meta.id,
      name: meta.name,
      thumbnail_url: meta.thumbnail_url,
      duplicate_count: meta.duplicate_count,
      like_count: meta.like_count,
      publisher: meta.publisher,
    };
  }) as ReadonlyArray<Partial<FigmaCommunityFileMeta>>;
}

// cache meta file
let __meta = null;

export class FigmaCommunityArchiveMetaRepository {
  readonly meta: any;

  constructor() {
    if (!__meta) {
      __meta = read_meta_file();
    }
    this.meta = __meta;
  }

  find(id: string): FigmaCommunityFileMeta {
    return this.meta.find((file) => file.id === id);
  }

  q({
    page,
    limit = 100,
    q,
    tag,
    shorten = true,
  }: FigmaCommunityFileQueryParams & {
    shorten?: boolean;
  }) {
    // if q is provided, search by q
    // if tag is provided, search by tag
    // do pagination

    const pass = () => true;
    const results = this.meta
      // q
      .filter(q ? (meta) => meta.name.includes(q) : pass)
      // tag
      .filter(tag ? (meta) => meta.tags.includes(tag) : pass)
      // pagination
      .slice((page - 1) * limit, page * limit);

    if (shorten) {
      return minify(...results);
    }
    return results;
  }

  page(
    page: number = 1,
    limit: number = 100,
    shorten: boolean = true
  ): ReadonlyArray<Partial<FigmaCommunityFileMeta>> {
    const start = (page - 1) * limit;
    const end = start + limit;
    if (shorten) {
      return minify(...this.meta.slice(start, end));
    }
    return this.meta.slice(start, end);
  }

  all() {
    return minify(...this.meta);
  }

  tags(): ReadonlyArray<string> {
    // set of all tags
    const tags = new Set<string>();
    this.meta.forEach((meta) => {
      meta.tags.forEach((tag) => tags.add(tag));
    });

    return Array.from(tags);
  }

  query_tag(tag: string): ReadonlyArray<Partial<FigmaCommunityFileMeta>> {
    const files = this.meta.filter((meta) => meta.tags.includes(tag));
    return minify(...files);
  }

  getStaticProps(id: string) {
    const meta = this.find(id);

    const {
      name,
      description,
      version_id,
      version,
      created_at,
      duplicate_count,
      like_count,
      thumbnail_url,
      publisher,
      support_contact,
      creator,
      tags,
      related_content,
    } = meta;

    // const s3_base = `https://figma-community-files.s3.us-west-1.amazonaws.com`;
    // const s3_file = `${s3_base}/${id}/file.json`;

    // const { data: filedata } = await Axios.get(s3_file);
    const related_contents = related_content.content
      .map((id) => this.find(id))
      .filter(Boolean)
      .map((meta) => {
        const {
          id,
          name,
          thumbnail_url,
          creator,
          like_count,
          duplicate_count,
        } = meta;

        return {
          id,
          name,
          thumbnail_url,
          creator,
          like_count,
          duplicate_count,
        };
      });

    return {
      id,
      name,
      description,
      version_id,
      version,
      created_at,
      duplicate_count,
      like_count,
      thumbnail_url,
      publisher,
      support_contact,
      creator,
      tags,
      related_contents,
    };
  }
}
