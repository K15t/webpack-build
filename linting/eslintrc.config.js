module.exports = {
    parserOptions: {
        ecmaVersion: 7,
        sourceType: 'module',
        ecmaFeatures: {
            jsx: true
        }
    },
    env: {
        browser: true
    },
    failOnWarning: false,
    failOnError: false,
    plugins: ['react'],
    extends: ['airbnb'],
    rules: {
        'indent': [2, 4, {"SwitchCase": 1}],
        'space-before-function-paren': [2, 'never'],

        'max-len': [1, 140, 4, {
            ignoreComments: true,
            ignoreUrls: true
        }],

        'comma-dangle': ['error', 'never'],
        'react/jsx-curly-spacing': [2, 'never'],
        'react/jsx-indent': [2, 4],
        'react/jsx-indent-props': [2, 4],
        'react/jsx-max-props-per-line': [2, {'maximum': 5}],
        'import/imports-first': ["warn", "DISABLE-absolute-first"],
        'jsx-a11y/no-static-element-interactions': 0,
        'jsx-quotes': [1, 'prefer-single'],

        'arrow-parens': ['error', 'always'],
        'react/forbid-prop-types': 0,
        'no-use-before-define': 0,
        'react/no-unescaped-entities': 0,
        'react/no-children-prop': 0,
        'prefer-rest-params': 0,
        'padded-blocks': 0,
        'no-underscore-dangle': 0
    }
};
