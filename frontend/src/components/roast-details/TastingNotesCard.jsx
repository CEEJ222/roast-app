import React from 'react';

const TastingNotesCard = ({ 
  roast, 
  tastingNotes, 
  onTastingNotesChange, 
  onSaveTastingNotes,
  savingTastingNotes,
  tastingNotesSaved 
}) => {
  return (
    <div className="bg-gray-50 dark:bg-dark-bg-tertiary rounded-lg p-4">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-dark-text-primary mb-4">Tasting Notes</h3>
      <p className="text-sm text-gray-600 dark:text-dark-text-secondary mb-3">
        Add your tasting notes after trying this coffee
      </p>
      <textarea
        value={tastingNotes}
        onChange={(e) => onTastingNotesChange(e.target.value)}
        placeholder="How did this roast taste? Any flavor notes, acidity, body, or other observations..."
        className="w-full border border-gray-300 dark:border-dark-border-primary rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-dark-accent-primary focus:border-transparent bg-white dark:bg-dark-bg-secondary text-gray-900 dark:text-dark-text-primary placeholder-gray-500 dark:placeholder-dark-text-tertiary"
        rows={4}
      />
      <div className="flex items-center gap-3">
        <button 
          onClick={onSaveTastingNotes}
          disabled={savingTastingNotes}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-indigo-700 hover:to-purple-700 font-medium transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {savingTastingNotes ? 'Saving...' : 'Save Tasting Notes'}
        </button>
        {tastingNotesSaved && (
          <span className="text-green-600 dark:text-green-400 text-sm font-medium flex items-center gap-1">
            ✅ Saved!
          </span>
        )}
      </div>
    </div>
  );
};

export default TastingNotesCard;
