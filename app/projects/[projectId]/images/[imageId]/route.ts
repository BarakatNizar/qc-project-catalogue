import { getServerUserFromAccess } from "@/core/auth/session";
import { projectService } from "@/modules/project/services/project-service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string; imageId: string }> | { projectId: string; imageId: string } }
) {
  const user = await getServerUserFromAccess();
  if (!user || "error" in user ) {
    return new Response("Unauthorized", { status: 401 });
  }

  const resolvedParams = await Promise.resolve(params);
  const projectId = resolvedParams?.projectId;
  const imageId = resolvedParams?.imageId;

  try {
    const image = await projectService.getImage(user, projectId, imageId);
    if (!("data" in image)) return new Response("Not found", { status: "authorize" in image ? 403 : 404 });
    const buffer = new Uint8Array(image.data);
    return new Response(buffer, {
      headers: {
        "Content-Type": image.mimeType || "application/octet-stream",
        "Content-Disposition": "inline",
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("❌ Image route exception:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}