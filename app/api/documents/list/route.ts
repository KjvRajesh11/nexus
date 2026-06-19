import { NextRequest, NextResponse } from "next/server";
import { ragEngine } from "@/lib/rag/engine";

/**
 * GET: Lists all ingested documents.
 */
export async function GET() {
  try {
    const documents = await ragEngine.listDocuments();
    return NextResponse.json({ success: true, documents });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("[List Route] GET error:", errMsg);
    return NextResponse.json(
      { success: false, error: errMsg || "Failed to list documents" },
      { status: 500 }
    );
  }
}

/**
 * DELETE: Deletes an ingested document and its chunks by ID.
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Document ID is required" },
        { status: 400 }
      );
    }

    await ragEngine.deleteDocument(id);
    console.log(`[List Route] Deleted document with ID: ${id}`);
    
    return NextResponse.json({ success: true, message: "Document deleted successfully" });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("[List Route] DELETE error:", errMsg);
    return NextResponse.json(
      { success: false, error: errMsg || "Failed to delete document" },
      { status: 500 }
    );
  }
}
