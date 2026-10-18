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
  function staticAlternatives(node) {
    if(!node) return [];
    if(ts.isStringLiteral(node)||ts.isNoSubstitutionTemplateLiteral(node)||ts.isNumericLiteral(node))
      return [node.text];
    if(ts.isJsxExpression(node)||ts.isParenthesizedExpression(node))
      return staticAlternatives(node.expression);
    if(ts.isConditionalExpression(node))
      return [...staticAlternatives(node.whenTrue),...staticAlternatives(node.whenFalse)];
    if(ts.isBinaryExpression(node) && node.operatorToken.kind===ts.SyntaxKind.PlusToken) {
      const left=staticAlternatives(node.left),right=staticAlternatives(node.right);
      if(!left.length || !right.length) return [];
      return left.flatMap(a=>right.map(b=>a+b)).slice(0,64);
    }
    if(ts.isTemplateExpression(node)) {
      let alternatives=[node.head.text];
      for(const span of node.templateSpans){
        const variants=staticAlternatives(span.expression);
        if(!variants.length)return [];
        alternatives=alternatives.flatMap(start=>variants.map(value=>start+value+span.literal.text)).slice(0,64);
      }
      return alternatives;
    }
    return [];
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
        const variants=staticAlternatives(node.initializer);
        if([classes,...variants].some(value=>/\bmin-h-10\b/.test(value)))
          add(node,"small-touch-target");
        else if(/min-h-/.test(classes) && !variants.length)
          add(node,"unverified-touch-class"); // Dynamic value may resolve to 40px.
        if([classes,...variants].some(value=>/\bbg-primary\b/.test(value)&&/\btext-white\b/.test(value)))
          add(node,"white-on-teal");
      }
    }
    ts.forEachChild(node,visit);
  }
  visit(parsed);
  return result;
}
