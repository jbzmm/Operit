import type { ComposeDslContext, ComposeNode } from "../../../types/compose-dsl";
import { buildMemoryCenterScreen } from "./screen";

export default function Screen(ctx: ComposeDslContext): ComposeNode {
  return buildMemoryCenterScreen(ctx);
}
