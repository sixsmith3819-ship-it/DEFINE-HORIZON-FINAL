'use client';

import { useState } from 'react';
import { CustomerInteraction, InteractionType } from '@/lib/types/customer';
import { 
  StickyNote, 
  Phone, 
  Mail, 
  Calendar, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp 
} from 'lucide-react';

interface InteractionTimelineProps {
  interactions?: CustomerInteraction[];
  canEdit?: boolean;
  canDelete?: boolean;
  onAddNote?: (content: string) => Promise<void>;
  onEditNote?: (id: string, content: string) => Promise<void>;
  onDeleteNote?: (id: string) => Promise<void>;
  isLoading?: boolean;
  createdByNames?: Record<string, string>;
}

export function InteractionTimeline({
  interactions = [],
  canEdit = false,
  canDelete = false,
  onAddNote,
  onEditNote,
  onDeleteNote,
  isLoading = false,
  createdByNames = {},
}: InteractionTimelineProps) {
  const [newNoteContent, setNewNoteContent] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [expandedInteractions, setExpandedInteractions] = useState<Set<string>>(new Set());

  const handleAddNote = async () => {
    const trimmedContent = newNoteContent.trim();
    if (!trimmedContent) {
      return;
    }

    if (!onAddNote) {
      return;
    }

    try {
      setIsSubmittingNote(true);
      await onAddNote(trimmedContent);
      setNewNoteContent('');
    } catch (error) {
      console.error('Failed to add note:', error);
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const handleEditNote = async (id: string) => {
    const trimmedContent = editingContent.trim();
    if (!trimmedContent) {
      return;
    }

    if (!onEditNote) {
      return;
    }

    try {
      setIsSubmittingEdit(true);
      await onEditNote(id, trimmedContent);
      setEditingId(null);
      setEditingContent('');
    } catch (error) {
      console.error('Failed to edit note:', error);
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleDeleteNote = async (id: string) => {
    if (!onDeleteNote) {
      return;
    }

    try {
      await onDeleteNote(id);
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  };

  const startEdit = (id: string, content: string) => {
    setEditingId(id);
    setEditingContent(content);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingContent('');
  };

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedInteractions);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedInteractions(newExpanded);
  };

  const getInteractionIcon = (type: InteractionType) => {
    const iconProps = { className: 'w-5 h-5', strokeWidth: 2 };
    
    switch (type) {
      case InteractionType.Note:
        return <StickyNote {...iconProps} />;
      case InteractionType.Call:
        return <Phone {...iconProps} />;
      case InteractionType.Email:
        return <Mail {...iconProps} />;
      case InteractionType.Meeting:
        return <Calendar {...iconProps} />;
      case InteractionType.Action:
        return <CheckCircle2 {...iconProps} />;
      default:
        return <StickyNote {...iconProps} />;
    }
  };

  // Sort interactions by createdAt (newest first)
  const sortedInteractions = [...interactions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const getInteractionTypeColor = (type: InteractionType): string => {
    switch (type) {
      case InteractionType.Note:
        return 'bg-blue-100 text-blue-800';
      case InteractionType.Call:
        return 'bg-green-100 text-green-800';
      case InteractionType.Email:
        return 'bg-purple-100 text-purple-800';
      case InteractionType.Meeting:
        return 'bg-orange-100 text-orange-800';
      case InteractionType.Action:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getInteractionTypeLabel = (type: InteractionType): string => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getAuthorName = (userId: string): string => {
    return createdByNames[userId] || 'Unknown User';
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-24 bg-gray-200 rounded-md mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded-md"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add Note Form */}
      {onAddNote && (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Add Note</h3>
          <textarea
            value={newNoteContent}
            onChange={(e) => setNewNoteContent(e.target.value)}
            placeholder="Enter your note here..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={3}
            disabled={isSubmittingNote}
          />
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleAddNote}
              disabled={isSubmittingNote || !newNoteContent.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
            >
              {isSubmittingNote ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="relative space-y-6">
        {/* Connecting line for desktop */}
        {sortedInteractions.length > 1 && (
          <div className="hidden md:block absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" aria-hidden="true"></div>
        )}
        
        {sortedInteractions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">No interactions yet</p>
          </div>
        ) : (
          sortedInteractions.map((interaction, index) => {
            const isExpanded = expandedInteractions.has(interaction.id);
            const contentLength = interaction.content.length;
            const showExpandButton = contentLength > 200;
            const displayContent = !isExpanded && showExpandButton 
              ? interaction.content.slice(0, 200) + '...' 
              : interaction.content;

            return (
              <div
                key={interaction.id}
                className={`relative flex gap-4 transition-all duration-300 ${
                  interaction.isDeleted ? 'opacity-50' : 'opacity-100'
                }`}
              >
                {/* Timeline dot and icon */}
                <div className="hidden md:flex flex-col items-center flex-shrink-0">
                  <div
                    className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-2 ${
                      interaction.isDeleted
                        ? 'bg-gray-100 border-gray-300 text-gray-400'
                        : 'bg-white border-gray-300 text-gray-700'
                    } ${
                      !interaction.isDeleted && 'shadow-sm'
                    }`}
                  >
                    {getInteractionIcon(interaction.interactionType)}
                  </div>
                </div>

                {/* Content card */}
                <div className="flex-1 min-w-0">
                  <div
                    className={`border rounded-lg p-4 transition-all duration-200 ${
                      interaction.isDeleted
                        ? 'border-gray-200 bg-gray-50'
                        : 'border-gray-200 bg-white hover:shadow-md hover:border-gray-300'
                    }`}
                  >
                    {/* Header with badge, author, and timestamps */}
                    <div className="flex flex-col gap-2 mb-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Icon for mobile */}
                        <span className="md:hidden">
                          <span
                            className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${
                              interaction.isDeleted
                                ? 'bg-gray-200 text-gray-400'
                                : getInteractionTypeColor(interaction.interactionType).replace('bg-', 'bg-').replace('text-', 'text-')
                            }`}
                          >
                            {getInteractionIcon(interaction.interactionType)}
                          </span>
                        </span>
                        
                        <span
                          className={`inline-block px-2 py-1 text-xs font-semibold rounded ${
                            interaction.isDeleted
                              ? 'bg-gray-200 text-gray-500'
                              : getInteractionTypeColor(interaction.interactionType)
                          }`}
                        >
                          {getInteractionTypeLabel(interaction.interactionType)}
                        </span>
                        <span className={`text-sm font-medium ${
                          interaction.isDeleted ? 'text-gray-500' : 'text-gray-900'
                        }`}>
                          {getAuthorName(interaction.createdBy)}
                        </span>
                        <span className="text-xs text-gray-500">{formatDate(interaction.createdAt)}</span>
                      </div>

                      {/* Edit indicator if modified */}
                      {interaction.updatedAt !== interaction.createdAt && !interaction.isDeleted && (
                        <p className="text-xs text-gray-500">
                          Edited by {getAuthorName(interaction.updatedBy)} on {formatDate(interaction.updatedAt)}
                        </p>
                      )}

                      {/* Deletion indicator */}
                      {interaction.isDeleted && interaction.deletedBy && (
                        <p className="text-xs text-red-600 italic font-medium">
                          Deleted by {getAuthorName(interaction.deletedBy)} on {formatDate(interaction.deletedAt || '')}
                        </p>
                      )}
                    </div>

                    {/* Content or Deleted Message */}
                    {interaction.isDeleted ? (
                      <p className="text-gray-400 italic text-sm line-through opacity-75">
                        Content removed
                      </p>
                    ) : editingId === interaction.id ? (
                      // Edit mode
                      <div className="space-y-3">
                        <textarea
                          value={editingContent}
                          onChange={(e) => setEditingContent(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none transition-shadow"
                          rows={3}
                          disabled={isSubmittingEdit}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditNote(interaction.id)}
                            disabled={isSubmittingEdit || !editingContent.trim()}
                            className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm transition-colors"
                          >
                            {isSubmittingEdit ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            onClick={cancelEdit}
                            disabled={isSubmittingEdit}
                            className="px-3 py-1 bg-gray-300 text-gray-900 rounded-md hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      // View mode
                      <div>
                        <p className={`text-sm whitespace-pre-wrap break-words ${
                          interaction.isDeleted ? 'text-gray-500 line-through' : 'text-gray-700'
                        }`}>
                          {displayContent}
                        </p>
                        
                        {/* Expand/collapse button */}
                        {showExpandButton && (
                          <button
                            onClick={() => toggleExpanded(interaction.id)}
                            className="flex items-center gap-1 mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                          >
                            {isExpanded ? (
                              <>
                                <ChevronUp className="w-4 h-4" />
                                Show less
                              </>
                            ) : (
                              <>
                                <ChevronDown className="w-4 h-4" />
                                Show more
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    )}

                    {/* Action buttons */}
                    {!interaction.isDeleted && (canEdit || canDelete) && editingId !== interaction.id && (
                      <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200">
                        {canEdit && onEditNote && (
                          <button
                            onClick={() => startEdit(interaction.id, interaction.content)}
                            className="text-sm text-blue-600 hover:text-blue-700 hover:underline font-medium transition-colors"
                          >
                            Edit
                          </button>
                        )}
                        {canDelete && onDeleteNote && (
                          <>
                            {showDeleteConfirm === interaction.id ? (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleDeleteNote(interaction.id)}
                                  className="text-sm text-red-600 hover:text-red-700 font-medium transition-colors"
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={() => setShowDeleteConfirm(null)}
                                  className="text-sm text-gray-600 hover:text-gray-700 font-medium transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setShowDeleteConfirm(interaction.id)}
                                className="text-sm text-red-600 hover:text-red-700 hover:underline font-medium transition-colors"
                              >
                                Delete
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
