"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsep_1 = __importDefault(require("jsep"));
function isLiteral(expression) {
    return expression.type === "Literal";
}
function isCallExpression(expression) {
    return expression.type === "CallExpression";
}
function isBinaryExpression(expression) {
    return expression.type === "BinaryExpression";
}
function isIdentifier(expression) {
    return expression.type === "Identifier";
}
function isValidFunction(expression) {
    if (!isIdentifier(expression.callee))
        return false;
    const length = expression.arguments.length;
    switch (expression.callee.name) {
        case "exp":
            return length === 2;
        case "sigmoid":
            return length === 3;
        case "exp_decay":
            return length === 3;
        default:
            throw new Error(`Invalid function ${expression.callee.name}.`);
    }
}
const allowedVariables = ["createdAt", "commentsCount", "sharedCount"];
function isValidExpression(expression) {
    if (isLiteral(expression)) {
        return typeof expression.value === "number";
    }
    else if (isIdentifier(expression)) {
        const allowed = allowedVariables.includes(expression.name);
        if (allowed)
            return true;
        else
            throw new Error(`Invalid variable ${expression.name}`);
    }
    else if (isCallExpression(expression)) {
        return (isValidFunction(expression) &&
            expression.arguments.every(isValidExpression));
    }
    else if (isBinaryExpression(expression)) {
        return (isValidExpression(expression.left) && isValidExpression(expression.right));
    }
    else {
        throw new Error(`Invalid expression ${JSON.stringify(expression)}`);
    }
}
function construcBinaryExpression(expression) {
    const operatorMap = {
        "+": "$add",
        "-": "$subtract",
        "*": "$multiply",
        "/": "$divide",
    };
    const operator = operatorMap[expression.operator];
    return {
        [operator]: [
            constructExpression(expression.left),
            constructExpression(expression.right),
        ],
    };
}
function constructCallExpression(expression) {
    if (!isIdentifier(expression.callee))
        throw new Error();
    switch (expression.callee.name) {
        case "exp":
            return { $exp: constructExpression(expression.arguments[0]) };
        case "exp_decay":
            return {
                $multiply: [
                    constructExpression(expression.arguments[0]),
                    {
                        $exp: {
                            $multiply: [
                                -1,
                                constructExpression(expression.arguments[1]),
                                constructExpression(expression.arguments[2]),
                            ],
                        },
                    },
                ],
            };
        default:
            return "";
    }
}
function constructExpression(expression) {
    if (isLiteral(expression)) {
        return expression.value;
    }
    else if (isIdentifier(expression)) {
        return `$${expression.name}`;
    }
    else if (isCallExpression(expression) && isIdentifier(expression.callee)) {
        return constructCallExpression(expression);
    }
    else if (isBinaryExpression(expression)) {
        return construcBinaryExpression(expression);
    }
    else {
        return "";
    }
}
function extractVariables(expression) {
    if (isIdentifier(expression)) {
        return [expression.name];
    }
    else if (isBinaryExpression(expression)) {
        return [
            ...extractVariables(expression.left),
            ...extractVariables(expression.right),
        ];
    }
    else if (isCallExpression(expression)) {
        return expression.arguments.flatMap(extractVariables);
    }
    else {
        return [];
    }
}
const expression = "sharedCount + ( commentsCount / 3 ) - exp_decay(createdAt, 1, 1)";
const tree = jsep_1.default(expression);
console.log(isValidExpression(tree));
console.log(JSON.stringify(constructExpression(tree), null, 2));
console.log(extractVariables(tree));
