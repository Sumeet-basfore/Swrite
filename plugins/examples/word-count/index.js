/**
 * Reference Plugin: Word Count Utility
 * Demonstrates Swrite Plugin API v1
 */
function activate(context) {
  context.logger.log('Word Count plugin activating...');

  context.registerCommand({
    id: 'count-selection',
    name: 'Count Words in Selection',
    description: 'Calculate word and character count in the current editor selection',
    slashTrigger: 'wordcount',
    execute: async () => {
      try {
        const text = context.editor.getSelectionText();
        const trimmed = text.trim();
        const wordCount = trimmed ? trimmed.split(/\s+/).length : 0;
        const charCount = text.length;

        context.logger.log(`Count result: ${wordCount} words, ${charCount} chars`);

        // Record last count in isolated storage
        await context.storage.set({
          lastCount: wordCount,
          lastChars: charCount,
          timestamp: new Date().toISOString(),
        });
      } catch (err) {
        context.logger.error('Error counting words:', err);
      }
    },
  });

  context.logger.log('Word Count plugin successfully activated.');
}

function deactivate() {
  console.log('[Plugin:swrite.word-count] Word Count plugin deactivated.');
}

// Support both common JS exports and global function scope
if (typeof exports !== 'undefined') {
  exports.activate = activate;
  exports.deactivate = deactivate;
}
