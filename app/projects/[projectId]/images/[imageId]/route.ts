import { getServerUserFromAccess } from "@/core/auth/session";
import { projectService } from "@/modules/project/services/project-service";

export async function GET(_request: Request, { params }: { params: Promise<{ projectId: string; imageId: string }> }) {
  const user = await getServerUserFromAccess();
  if (!user || "error" in user) return new Response("Unauthorized", { status: 401 });
  const { projectId, imageId } = await params;
  try {
    const image = await projectService.getImage(user, projectId, imageId);
    return new Response(new Uint8Array(image.data), {
      headers: {
        "Content-Type": image.mimeType,
        "Content-Disposition": "inline",
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
