import firebaseRulesPlugin from '@firebase/eslint-plugin-security-rules';

export default [
  {
    ignores: ['dist/**/*']
  },
  {
    files: ['firestore.rules', 'DRAFT_firestore.rules'],
    plugins: {
      '@firebase/security-rules': firebaseRulesPlugin
    },
    rules: {
      '@firebase/security-rules/no-unprotected-common-writes': 'error',
      '@firebase/security-rules/no-unprotected-public-writes': 'error'
    },
    languageOptions: {
      parser: firebaseRulesPlugin.parsers.firestore
    }
  }
]
