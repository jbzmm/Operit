import type { ComposeDslContext, ComposeNode } from "../../../types/compose-dsl";
import { buildMemorySettingsScreen } from "./screen";

export default function Screen(ctx: ComposeDslContext): ComposeNode {
  return buildMemorySettingsScreen(ctx);
}
