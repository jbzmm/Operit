import type { ComposeDslContext, ComposeNode } from "../../../types/compose-dsl";
import { buildMemoryAttachmentScreen } from "./screen";

export default function Screen(ctx: ComposeDslContext): ComposeNode {
  return buildMemoryAttachmentScreen(ctx);
}
