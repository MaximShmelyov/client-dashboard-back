export default {
  rules: {
    'no-cyrillic-string': {
      create(context) {
        return {
          Literal(node) {
            if (
              typeof node.value === 'string' &&
              /[А-Яа-яЁё]/.test(node.value)
            ) {
              context.report({
                node,
                message: 'Cyrillic not allowed in string literals',
              });
            }
          },
          TemplateElement(node) {
            if (/[А-Яа-яЁё]/.test(node.value.raw)) {
              context.report({
                node,
                message: 'Cyrillic not allowed in template strings',
              });
            }
          },
        };
      },
    },
  },
};
