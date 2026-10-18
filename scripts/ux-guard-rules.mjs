import ts from "typescript";

/** Rule identifiers are pinned in UX-GUARD-WAIVERS.json; do not silently rename. */
export function scanUxSource(path, source) {
  const parsed=ts.createSourceFile(path,source,ts.ScriptTarget.Latest,true,
    /\.[jt]sx$/.test(path)?ts.ScriptKind.TSX:ts.ScriptKind.TS);
  const result=[];
  function add(node,rule) {
    result.push({
      rule,
      snippet:node.getText(parsed).replace(/\s+/g," ").trim(),
      line:parsed.getLineAndCharacterOfPosition(node.getStart(parsed)).line+1,
    });
  }
  function isStaticSafeTarget(expression) {
    if(!expression) return true;
    if(ts.isParenthesizedExpression(expression))return isStaticSafeTarget(expression.expression);
    if(ts.isStringLiteral(expression)||ts.isNoSubstitutionTemplateLiteral(expression))
      return ["_self","_parent","_top"].includes(expression.text);
    return expression.kind===ts.SyntaxKind.NullKeyword ||
      expression.kind===ts.SyntaxKind.UndefinedKeyword ||
      expression.getText(parsed)==="undefined";
  }
  function visit(node) {
    if(ts.isCallExpression(node)&&ts.isPropertyAccessExpression(node.expression) &&
      node.expression.expression.getText(parsed)==="window" &&
      ["confirm","alert","prompt","open"].includes(node.expression.name.text)) add(node,"native-popup");
    if(ts.isJsxAttribute(node)){
      if(node.name.text==="target" && node.initializer) {
        const init=node.initializer;
        if(ts.isStringLiteral(init) ? !["_self","_parent","_top"].includes(init.text) :
           ts.isJsxExpression(init) ? !isStaticSafeTarget(init.expression) : true)
          add(node,"unsafe-target"); // Unknown computed target must be reviewed, not assumed _self.
      }
      if(node.name.text==="className" && node.initializer) {
        const classes=node.initializer.getText(parsed);
        if(/\bmin-h-10\b/.test(classes)) add(node,"small-touch-target");
        if(/\bbg-primary\b/.test(classes)&&/\btext-white\b/.test(classes))
          add(node,"white-on-teal");
      }
    }
    ts.forEachChild(node,visit);
  }
  visit(parsed);
  return result;
}
