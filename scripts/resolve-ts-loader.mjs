export async function resolve(specifier, context, nextResolve) {
  try { return await nextResolve(specifier, context); }
  catch (error) {
    if (!specifier.startsWith(".") && !specifier.startsWith("/")) throw error;
    for (const extension of [".ts", ".mts", ".js", ".mjs"]) {
      try { return await nextResolve(new URL(specifier + extension, context.parentURL).href, context); }
      catch {}
    }
    throw error;
  }
}
