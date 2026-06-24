import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { boardAPI, listAPI, cardAPI, memberAPI } from '../services/api';

function BoardPage() {
  const { id: boardId } = useParams();
  const [board, setBoard] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // New List State
  const [newListTitle, setNewListTitle] = useState('');
  const [showAddList, setShowAddList] = useState(false);

  // New Card State (per list)
  const [activeAddCardListId, setActiveAddCardListId] = useState(null);
  const [newCardTitle, setNewCardTitle] = useState('');

  // Selected Card for Modal Detail
  const [selectedCard, setSelectedCard] = useState(null);
  const [isEditingCardTitle, setIsEditingCardTitle] = useState(false);
  const [cardTitleInput, setCardTitleInput] = useState('');
  const [cardDescInput, setCardDescInput] = useState('');
  const [cardDueDateInput, setCardDueDateInput] = useState('');
  
  // Tag Creation State
  const [showTagCreator, setShowTagCreator] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#3B82F6');

  // Drag and drop tracking
  const draggedCardRef = useRef(null); // { cardId, sourceListId, sourcePosition }
  const dragOverCardRef = useRef(null); // { listId, index }
  const [draggedCardId, setDraggedCardId] = useState(null);

  const fetchBoard = async () => {
    try {
      const data = await boardAPI.getById(boardId);
      setBoard(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching board:', err);
      setError('Failed to load board details.');
    }
  };

  const fetchMembers = async () => {
    try {
      const data = await memberAPI.getAll();
      setMembers(data);
    } catch (err) {
      console.error('Error fetching members:', err);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchBoard(), fetchMembers()]);
      setLoading(false);
    };
    init();
  }, [boardId]);

  // List Handlers
  const handleAddList = async (e) => {
    e.preventDefault();
    if (!newListTitle.trim()) return;

    try {
      const created = await listAPI.create(Number(boardId), newListTitle.trim());
      // Append new list to local state
      setBoard(prev => ({
        ...prev,
        lists: [...prev.lists, { ...created, cards: [] }]
      }));
      setNewListTitle('');
      setShowAddList(false);
    } catch (err) {
      console.error('Error adding list:', err);
      alert('Failed to add list.');
    }
  };

  const handleDeleteList = async (listId, title) => {
    if (!window.confirm(`Are you sure you want to delete the list "${title}"? All cards inside it will be permanently deleted.`)) {
      return;
    }

    try {
      await listAPI.delete(listId);
      setBoard(prev => ({
        ...prev,
        lists: prev.lists.filter(l => l.id !== listId)
      }));
    } catch (err) {
      console.error('Error deleting list:', err);
      alert('Failed to delete list.');
    }
  };

  const handleUpdateListTitle = async (listId, currentTitle) => {
    const newTitle = window.prompt('Rename List:', currentTitle);
    if (newTitle === null || !newTitle.trim() || newTitle.trim() === currentTitle) return;

    try {
      const updated = await listAPI.update(listId, newTitle.trim());
      setBoard(prev => ({
        ...prev,
        lists: prev.lists.map(l => l.id === listId ? { ...l, title: updated.title } : l)
      }));
    } catch (err) {
      console.error('Error updating list title:', err);
    }
  };

  // Card Handlers
  const handleAddCard = async (listId) => {
    if (!newCardTitle.trim()) return;

    try {
      const created = await cardAPI.create(listId, newCardTitle.trim(), '', null);
      
      // Inject tags/members empty arrays to fit frontend layout
      created.tags = [];
      created.members = [];

      setBoard(prev => ({
        ...prev,
        lists: prev.lists.map(l => {
          if (l.id === listId) {
            return { ...l, cards: [...l.cards, created] };
          }
          return l;
        })
      }));

      setNewCardTitle('');
      setActiveAddCardListId(null);
    } catch (err) {
      console.error('Error adding card:', err);
      alert('Failed to create card.');
    }
  };

  // Drag and Drop Logic
  const handleDragStart = (e, card, sourceListId, position) => {
    draggedCardRef.current = { cardId: card.id, sourceListId, sourcePosition: position };
    setDraggedCardId(card.id);
    e.dataTransfer.setData('text/plain', card.id.toString());
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedCardId(null);
    draggedCardRef.current = null;
    dragOverCardRef.current = null;
  };

  const handleDragOverList = (e, targetListId) => {
    e.preventDefault();
    // If not hovering over a specific card, dragOverCardRef.current remains null
    // signaling an append drop behavior
  };

  const handleDragOverCard = (e, targetListId, index) => {
    e.preventDefault();
    e.stopPropagation();
    dragOverCardRef.current = { listId: targetListId, index };
  };

  const handleDrop = async (e, targetListId) => {
    e.preventDefault();
    if (!draggedCardRef.current) return;

    const { cardId, sourceListId } = draggedCardRef.current;
    
    // Determine target index
    let targetIndex = 0;
    const targetListObj = board.lists.find(l => l.id === targetListId);
    
    if (dragOverCardRef.current && dragOverCardRef.current.listId === targetListId) {
      targetIndex = dragOverCardRef.current.index;
    } else {
      // Append to the end
      targetIndex = targetListObj ? targetListObj.cards.length : 0;
    }

    // Optimistically update frontend state
    const sourceList = board.lists.find(l => l.id === sourceListId);
    const cardToMove = sourceList.cards.find(c => c.id === cardId);

    if (!cardToMove) return;

    // Remove from source
    let newLists = board.lists.map(list => {
      if (list.id === sourceListId) {
        return {
          ...list,
          cards: list.cards.filter(c => c.id !== cardId)
        };
      }
      return list;
    });

    // Insert into target
    newLists = newLists.map(list => {
      if (list.id === targetListId) {
        const cardsCopy = [...list.cards];
        
        // If same list, the index might have shifted since we removed the card first
        let insertIndex = targetIndex;
        if (sourceListId === targetListId && cardToMove.position < targetIndex) {
          // Adjust insert index because removing card shifted items down
          insertIndex = Math.max(0, targetIndex - 1);
        }

        cardsCopy.splice(insertIndex, 0, cardToMove);
        
        // Recalculate positional indices
        const updatedCards = cardsCopy.map((c, idx) => ({ ...c, position: idx }));
        return { ...list, cards: updatedCards };
      }
      return list;
    });

    // Also need to re-index positions in source list if it changed
    if (sourceListId !== targetListId) {
      newLists = newLists.map(list => {
        if (list.id === sourceListId) {
          return {
            ...list,
            cards: list.cards.map((c, idx) => ({ ...c, position: idx }))
          };
        }
        return list;
      });
    }

    setBoard(prev => ({ ...prev, lists: newLists }));

    try {
      // Send changes to database
      await cardAPI.move(cardId, targetListId, targetIndex);
    } catch (err) {
      console.error('Failed to persist card move on backend:', err);
      // Re-fetch board to restore sync on error
      fetchBoard();
    }
  };

  // Card Modal Detail Handlers
  const handleOpenCardDetails = async (card) => {
    setSelectedCard(card);
    setCardTitleInput(card.title);
    setCardDescInput(card.description || '');
    setCardDueDateInput(card.due_date ? card.due_date.substring(0, 16) : ''); // Format to YYYY-MM-DDTHH:MM
  };

  const handleUpdateCardDetails = async () => {
    if (!cardTitleInput.trim()) return;

    try {
      const updated = await cardAPI.update(
        selectedCard.id,
        cardTitleInput.trim(),
        cardDescInput.trim(),
        cardDueDateInput || null
      );

      // Keep tags & members which may not be returned fully on simple card put
      updated.tags = selectedCard.tags;
      updated.members = selectedCard.members;

      setSelectedCard(updated);
      setBoard(prev => ({
        ...prev,
        lists: prev.lists.map(l => ({
          ...l,
          cards: l.cards.map(c => c.id === selectedCard.id ? updated : c)
        }))
      }));
      setIsEditingCardTitle(false);
    } catch (err) {
      console.error('Error updating card details:', err);
    }
  };

  const handleDeleteCard = async () => {
    if (!window.confirm('Are you sure you want to delete this card permanently?')) return;

    try {
      await cardAPI.delete(selectedCard.id);
      setBoard(prev => ({
        ...prev,
        lists: prev.lists.map(l => ({
          ...l,
          cards: l.cards.filter(c => c.id !== selectedCard.id)
        }))
      }));
      setSelectedCard(null);
    } catch (err) {
      console.error('Error deleting card:', err);
    }
  };

  // Modal tags
  const handleToggleTag = async (tag) => {
    const hasTag = selectedCard.tags.some(t => t.id === tag.id);
    try {
      let updated;
      if (hasTag) {
        updated = await cardAPI.removeTag(selectedCard.id, tag.id);
      } else {
        updated = await cardAPI.addTag(selectedCard.id, tag.id);
      }

      // Sync local modal state
      setSelectedCard(updated);
      // Sync board state
      setBoard(prev => ({
        ...prev,
        lists: prev.lists.map(l => ({
          ...l,
          cards: l.cards.map(c => c.id === selectedCard.id ? updated : c)
        }))
      }));
    } catch (err) {
      console.error('Error toggling card tag:', err);
    }
  };

  // Modal members
  const handleToggleMember = async (memberId) => {
    const isAssigned = selectedCard.members.some(m => m.id === memberId);
    try {
      let updated;
      if (isAssigned) {
        updated = await cardAPI.removeMember(selectedCard.id, memberId);
      } else {
        updated = await cardAPI.addMember(selectedCard.id, memberId);
      }

      setSelectedCard(updated);
      setBoard(prev => ({
        ...prev,
        lists: prev.lists.map(l => ({
          ...l,
          cards: l.cards.map(c => c.id === selectedCard.id ? updated : c)
        }))
      }));
    } catch (err) {
      console.error('Error toggling member assignment:', err);
    }
  };

  // Create board-level tag
  const handleCreateBoardTag = async (e) => {
    e.preventDefault();
    if (!newTagName.trim()) return;

    try {
      const tag = await cardAPI.createTag(Number(boardId), newTagName.trim(), newTagColor);
      setBoard(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
      setNewTagName('');
      setShowTagCreator(false);
    } catch (err) {
      console.error('Error creating board tag:', err);
    }
  };

  const handleDeleteBoardTag = async (tagId) => {
    if (!window.confirm('Delete this tag definition from the board? It will be removed from all cards.')) return;

    try {
      await cardAPI.deleteTag(tagId);
      
      // Update board tags definitions
      setBoard(prev => {
        const remainingTags = prev.tags.filter(t => t.id !== tagId);
        
        // Remove from all cards locally
        const cleanedLists = prev.lists.map(l => ({
          ...l,
          cards: l.cards.map(c => ({
            ...c,
            tags: c.tags.filter(t => t.id !== tagId)
          }))
        }));

        return {
          ...prev,
          tags: remainingTags,
          lists: cleanedLists
        };
      });

      // Update currently open card in modal if needed
      if (selectedCard) {
        setSelectedCard(prev => ({
          ...prev,
          tags: prev.tags.filter(t => t.id !== tagId)
        }));
      }
    } catch (err) {
      console.error('Error deleting board tag:', err);
    }
  };

  const isOverdue = (dueDateStr, listTitle) => {
    if (!dueDateStr) return false;
    if (listTitle && listTitle.toLowerCase() === 'done') return false; // Not overdue if already Done
    return new Date(dueDateStr) < new Date();
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Loading Kanban board...</p>
      </div>
    );
  }

  if (error || !board) {
    return (
      <div className="text-center py-12 text-red-500">
        <h2 className="text-xl font-bold">Error</h2>
        <p className="mt-2 text-sm">{error || 'Board not found'}</p>
        <Link to="/boards" className="mt-4 inline-block text-sm font-semibold text-blue-600 hover:underline">
          Go back to Boards List
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-8.5rem)] flex-col gap-6">
      {/* Board Header Bar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between shrink-0">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <Link to="/boards" className="hover:text-blue-500">Boards</Link>
            <span>/</span>
            <span className="text-slate-600 dark:text-slate-300">Board Workspace</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white mt-1 leading-tight">
            {board.title}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
            {board.description || 'No description provided.'}
          </p>
        </div>

        {/* Board actions */}
        <div className="flex gap-2">
          <button
            onClick={() => handleUpdateListTitle(board.lists[0]?.id, 'Board Name')}
            className="hidden" // Internal helper hook or we edit it directly
          />
        </div>
      </div>

      {/* Board Workspace Grid Scroll Container */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
        <div className="flex items-start gap-4 h-full">
          {/* Render Lists */}
          {board.lists.map(list => (
            <div
              key={list.id}
              onDragOver={(e) => handleDragOverList(e, list.id)}
              onDrop={(e) => handleDrop(e, list.id)}
              className="flex flex-col max-h-full w-72 rounded-2xl border border-slate-200/80 bg-slate-100/70 p-3.5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/60 transition-colors duration-200 shrink-0"
            >
              {/* List Header */}
              <div className="flex items-center justify-between pb-3 shrink-0">
                <button
                  onClick={() => handleUpdateListTitle(list.id, list.title)}
                  className="text-sm font-bold text-slate-800 hover:text-blue-600 dark:text-slate-200 dark:hover:text-blue-400 text-left truncate cursor-pointer"
                >
                  {list.title}
                </button>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-bold text-slate-400 bg-white dark:bg-slate-950 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-800">
                    {list.cards.length}
                  </span>
                  <button
                    onClick={() => handleDeleteList(list.id, list.title)}
                    className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-red-600 dark:hover:bg-slate-800 dark:hover:text-red-400 transition-colors cursor-pointer"
                    title="Delete list"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Cards scroll container */}
              <div className="flex-1 overflow-y-auto space-y-2.5 py-1 min-h-[50px]">
                {list.cards.map((card, index) => {
                  const cardIsOverdue = isOverdue(card.due_date, list.title);
                  return (
                    <div
                      key={card.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, card, list.id, index)}
                      onDragEnd={handleDragEnd}
                      onDragOver={(e) => handleDragOverCard(e, list.id, index)}
                      onClick={() => handleOpenCardDetails(card)}
                      className={`group relative flex flex-col gap-2.5 rounded-xl border bg-white p-4 shadow-sm dark:bg-slate-950 hover:shadow hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200 cursor-grab active:cursor-grabbing select-none ${
                        draggedCardId === card.id ? 'card-dragging' : ''
                      } ${
                        cardIsOverdue 
                          ? 'border-red-200 hover:border-red-300 dark:border-red-900/60' 
                          : 'border-slate-200/80 dark:border-slate-800/80'
                      }`}
                    >
                      {/* Tags */}
                      {card.tags && card.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {card.tags.map(t => (
                            <span 
                              key={t.id} 
                              className="text-[9px] font-bold px-1.5 py-0.5 rounded-md"
                              style={{ backgroundColor: t.color + '15', color: t.color }}
                            >
                              {t.name}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Card Title */}
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug">
                        {card.title}
                      </h4>

                      {/* Card Meta details (Due dates / Members assigned) */}
                      {(card.due_date || (card.members && card.members.length > 0)) && (
                        <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400">
                          {/* Due Date Indicator */}
                          {card.due_date ? (
                            <div className={`flex items-center gap-1 font-medium ${
                              cardIsOverdue ? 'text-red-500' : 'text-slate-400'
                            }`}>
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-3.5 w-3.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z" />
                              </svg>
                              <span>
                                {new Date(card.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                          ) : (
                            <div></div>
                          )}

                          {/* Members Avatars stack */}
                          {card.members && card.members.length > 0 && (
                            <div className="flex -space-x-1.5 overflow-hidden">
                              {card.members.map(m => (
                                <img
                                  key={m.id}
                                  src={m.avatar_url}
                                  alt={m.name}
                                  title={m.name}
                                  className="inline-block h-5 w-5 rounded-full ring-2 ring-white bg-slate-100 dark:ring-slate-950 dark:bg-slate-800"
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Add Card action */}
              <div className="mt-2 shrink-0">
                {activeAddCardListId === list.id ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      required
                      value={newCardTitle}
                      onChange={(e) => setNewCardTitle(e.target.value)}
                      placeholder="Enter task title..."
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950"
                      autoFocus
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => {
                          setNewCardTitle('');
                          setActiveAddCardListId(null);
                        }}
                        className="rounded-lg px-2.5 py-1.5 text-2xs font-semibold text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleAddCard(list.id)}
                        className="rounded-lg bg-blue-600 px-2.5 py-1.5 text-2xs font-semibold text-white hover:bg-blue-500 cursor-pointer"
                      >
                        Add Task
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setActiveAddCardListId(list.id);
                      setNewCardTitle('');
                    }}
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 py-2 text-xs font-semibold text-slate-500 hover:bg-white dark:border-slate-800 dark:hover:bg-slate-950 hover:border-slate-400 dark:hover:border-slate-700 hover:text-slate-700 dark:hover:text-slate-300 transition-all cursor-pointer"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="h-3.5 w-3.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Add Task
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Add List Action Card */}
          <div className="w-72 shrink-0">
            {showAddList ? (
              <form onSubmit={handleAddList} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-3">
                <input
                  type="text"
                  required
                  value={newListTitle}
                  onChange={(e) => setNewListTitle(e.target.value)}
                  placeholder="Enter list title (e.g. Backlog)"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950"
                  autoFocus
                />
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setNewListTitle('');
                      setShowAddList(false);
                    }}
                    className="rounded-lg px-3 py-1.5 text-2xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-2xs font-semibold text-white hover:bg-blue-500 cursor-pointer"
                  >
                    Add List
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setShowAddList(true)}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-250 py-4.5 text-sm font-bold text-slate-500 hover:bg-white dark:border-slate-800 dark:hover:bg-slate-900/40 hover:border-slate-400 dark:hover:border-slate-700 hover:text-slate-800 dark:hover:text-slate-200 transition-all cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Add List
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Selected Card Modal Detail overlay */}
      {selectedCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-scale-up max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-150 dark:border-slate-800 shrink-0">
              <div className="flex-1 mr-4">
                {isEditingCardTitle ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={cardTitleInput}
                      onChange={(e) => setCardTitleInput(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-lg font-bold focus:outline-none dark:border-slate-800 dark:bg-slate-950 focus:border-blue-500"
                      autoFocus
                    />
                    <button
                      onClick={handleUpdateCardDetails}
                      className="rounded-lg bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-500 cursor-pointer"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setCardTitleInput(selectedCard.title);
                        setIsEditingCardTitle(false);
                      }}
                      className="rounded-lg border border-slate-250 px-3 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <h3 
                    onClick={() => setIsEditingCardTitle(true)}
                    className="text-lg font-bold text-slate-950 dark:text-white cursor-pointer hover:text-blue-600"
                    title="Click to edit title"
                  >
                    {selectedCard.title}
                  </h3>
                )}
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Inside List:{' '}
                  <strong className="text-slate-500 dark:text-slate-300">
                    {board.lists.find(l => l.id === selectedCard.list_id)?.title}
                  </strong>
                </span>
              </div>
              <button
                onClick={() => setSelectedCard(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300 cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto py-5 grid gap-6 md:grid-cols-3">
              {/* Left Column: Description & Metadata Updates */}
              <div className="md:col-span-2 space-y-5">
                {/* Description Box */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">
                    Description
                  </label>
                  <textarea
                    rows={4}
                    value={cardDescInput}
                    onChange={(e) => setCardDescInput(e.target.value)}
                    placeholder="Provide detailed logs or task steps..."
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm dark:border-slate-800 dark:bg-slate-950 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                {/* Due Date Picker */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">
                    Due Date
                  </label>
                  <input
                    type="datetime-local"
                    value={cardDueDateInput}
                    onChange={(e) => setCardDueDateInput(e.target.value)}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm dark:border-slate-800 dark:bg-slate-950 focus:border-blue-500 focus:outline-none"
                  />
                  {isOverdue(selectedCard.due_date) && (
                    <span className="ml-3 inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-1 text-2xs font-semibold text-red-600 dark:bg-red-950/20 dark:text-red-400">
                      Overdue Task
                    </span>
                  )}
                </div>

                <div className="flex gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={handleUpdateCardDetails}
                    className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 hover:scale-102 transition-transform cursor-pointer"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={handleDeleteCard}
                    className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 hover:scale-102 transition-transform cursor-pointer"
                  >
                    Delete Card
                  </button>
                </div>
              </div>

              {/* Right Column: Assignments (Tags and Members) */}
              <div className="md:col-span-1 space-y-6">
                {/* Team Members Assignment */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">
                    Assignees
                  </label>
                  <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto">
                    {members.map(member => {
                      const isAssigned = selectedCard.members.some(m => m.id === member.id);
                      return (
                        <button
                          key={member.id}
                          onClick={() => handleToggleMember(member.id)}
                          className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs text-left transition-colors cursor-pointer ${
                            isAssigned 
                              ? 'bg-blue-50 border border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-900/60 dark:text-blue-300' 
                              : 'border border-slate-100 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <img src={member.avatar_url} alt="" className="h-4.5 w-4.5 rounded-full" />
                            <span className="font-semibold">{member.name}</span>
                          </div>
                          {isAssigned && (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                              <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Tags Management */}
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">
                      Card Tags
                    </label>
                    <button
                      onClick={() => setShowTagCreator(!showTagCreator)}
                      className="text-2xs font-bold text-blue-600 hover:underline dark:text-blue-400 cursor-pointer"
                    >
                      {showTagCreator ? 'Close' : '+ New Tag'}
                    </button>
                  </div>

                  {/* Create Board Tag Form Inline */}
                  {showTagCreator && (
                    <form onSubmit={handleCreateBoardTag} className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2 dark:border-slate-800 dark:bg-slate-950 animate-scale-up">
                      <input
                        type="text"
                        required
                        value={newTagName}
                        onChange={(e) => setNewTagName(e.target.value)}
                        placeholder="Tag label..."
                        className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-2xs focus:outline-none dark:border-slate-800 dark:bg-slate-900"
                        autoFocus
                      />
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] text-slate-400">Color</label>
                        <input
                          type="color"
                          value={newTagColor}
                          onChange={(e) => setNewTagColor(e.target.value)}
                          className="h-5 w-8 rounded cursor-pointer"
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full rounded-lg bg-blue-600 py-1 text-2xs font-bold text-white hover:bg-blue-500 cursor-pointer"
                      >
                        Create Tag
                      </button>
                    </form>
                  )}

                  {/* Toggle tags */}
                  <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto">
                    {board.tags.map(tag => {
                      const hasTag = selectedCard.tags.some(t => t.id === tag.id);
                      return (
                        <div key={tag.id} className="flex items-center justify-between group">
                          <button
                            onClick={() => handleToggleTag(tag)}
                            className={`flex-1 flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs text-left transition-colors cursor-pointer mr-2 ${
                              hasTag 
                                ? 'bg-slate-50 border border-slate-200 font-semibold dark:bg-slate-800/40 dark:border-slate-800' 
                                : 'border border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/40'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: tag.color }}></div>
                              <span>{tag.name}</span>
                            </div>
                            {hasTag && (
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-blue-600 dark:text-blue-400">
                                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                              </svg>
                            )}
                          </button>
                          
                          <button
                            onClick={() => handleDeleteBoardTag(tag.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
                            title="Delete board tag definition"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-3.5 w-3.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BoardPage;
