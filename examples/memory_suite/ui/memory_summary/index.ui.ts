import type { ComposeDslContext, ComposeNode } from "../../../types/compose-dsl";
import { buildMemorySummaryScreen } from "./screen";

export default function Screen(ctx: ComposeDslContext): ComposeNode {
  return buildMemorySummaryScreen(ctx);
}
