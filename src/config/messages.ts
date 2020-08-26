const MESSAGES: {
  LOGS: Record<string, string>
  ERRORS: Record<string, string>
} = {
  LOGS: {
    STORAGE_IMPORTED: '⬇️ <{0}> has been imported from storage:',
    STORAGE_SAVED: '⬆️ <{0}> has been saved to storage:',
    STORAGE_REMOVED: '⏹️ <{0}> has been removed from storage.',
    TRAIT_CREATED: '🆕 <{0}> has been created:',
    TRAIT_UPDATED: '🔄 <{0}> has been updated:',
    SELECTOR_UPDATED: '*️⃣ <{0}> has been updated based on <{1}>:'
  },
  ERRORS: {
    NO_STORE_FOUND:
      'No store found. You need to wrap your root component using the `withTemper()` hoc.',
    PATH_NO_STRING: 'Trait needs a string path to be accessed',
    PATH_EMPTY_STRING: 'Trait cannot be accessed with an empty path',
    STORAGE_MISS_GET:
      'Your storage service must implement a method to retrieve a persisted Trait.',
    STORAGE_MISS_SET:
      'Your storage service must implement a method to persist a Trait.',
    STORAGE_MISS_CLEAR:
      'Your storage service must implement a method to remove a Trait.',
    TRAIT_DOES_NOT_EXIST:
      "Trait <{0}> doesn't exist and you cannot depend on it",
    TRAIT_WRONG_TYPE:
      'Trait <{0}> has been initialized as <{1}> and cannot receive a <{2}> update',
    SUBSCRIPTION_NO_CALLBACK: 'Trait cannot be subscribed without a callback'
  }
}

export default MESSAGES
