import { client, workspaceclient } from "@/lib/supabase/server";
import type {
  FormResponseUnknownFieldHandlingStrategyType,
  GDocumentType,
} from "@/types";
import assert from "assert";

/**
 * NO RLS - use with caution
 */
class DocumentSetupAssistantService {
  constructor(
    readonly project_id: number,
    private readonly doctype: GDocumentType
  ) {}

  protected async createMasterDocument() {
    const { data: document_ref, error: doc_ref_err } = await workspaceclient
      .from("document")
      .insert({
        project_id: this.project_id,
        doctype: this.doctype,
      })
      .select()
      .single();

    if (doc_ref_err) {
      console.error(doc_ref_err);
      throw doc_ref_err;
    }

    assert(document_ref, "document not created");
    return document_ref;
  }
}

/**
 * NO RLS - use with caution
 */
export class FormDocumentSetupAssistantService extends DocumentSetupAssistantService {
  constructor(
    readonly project_id: number,
    private readonly seed: Partial<{
      default_form_page_id?: string | null;
      description?: string | null;
      is_max_form_responses_by_customer_enabled?: boolean;
      is_max_form_responses_in_total_enabled?: boolean;
      max_form_responses_by_customer?: number | null;
      max_form_responses_in_total?: number | null;
      title?: string;
      unknown_field_handling_strategy?: FormResponseUnknownFieldHandlingStrategyType;
    }> = {}
  ) {
    super(project_id, "v0_form");
  }
  //
  async createFormDocument() {
    const { data: form, error } = await client
      .from("form")
      .insert({
        project_id: this.project_id,
        ...this.seed,
      })
      .select("*")
      .single();

    if (error) {
      console.error(error);
      throw error;
    }

    if (!form) {
      console.error("form not created");
      throw error;
    }

    // create document
    const document_ref = await this.createMasterDocument();

    // create a form document
    const { data: form_document, error: form_doc_err } = await client
      .from("form_document")
      .insert({
        id: document_ref.id,
        form_id: form.id,
        project_id: this.project_id,
        name: form.title,
      })
      .select("id")
      .single();

    if (form_doc_err) {
      console.error(form_doc_err);
      throw form_doc_err;
    }

    // link the page to the form
    await client
      .from("form")
      .update({
        default_form_page_id: form_document!.id,
      })
      .eq("id", form.id);

    return {
      form_id: form.id,
      form_document_id: form_document!.id,
    };
  }
}

export async function seed_form_document_blocks({
  form_id,
  form_document_id: form_document_id,
}: {
  form_id: string;
  form_document_id: string;
}) {
  // default template blocks
  // 1. section
  // - header block
  // - field block

  const { data: section_block } = await client
    .from("form_block")
    .insert({
      type: "section",
      form_id,
      form_page_id: form_document_id,
      local_index: 0,
    })
    .select("id")
    .single();

  const section_1_id = section_block!.id;

  await client.from("form_block").insert([
    {
      type: "header",
      form_id,
      form_page_id: form_document_id,
      parent_id: section_1_id,
      title_html: "Untitled Section",
      local_index: 0,
    },
    {
      type: "field",
      form_id,
      form_page_id: form_document_id,
      parent_id: section_1_id,
      local_index: 0,
    },
  ]);
}
