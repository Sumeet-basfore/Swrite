import React, { useState, useMemo } from 'react';
import { useSwriteStore } from '../../store/useSwriteStore';
import { 
  OrganizationProposal, OrganizationDomain, ProjectIntelligenceResult 
} from '../../types/intelligence';
import { 
  filterProposals, getProposalStats, getOrganizationProvider, 
  ProjectIntelligenceApplier 
} from '../../engine/intelligence';
import { 
  Sparkles, CheckCircle2, XCircle, AlertTriangle, HelpCircle, 
  ShieldCheck, RotateCcw, Filter, Search, User, MapPin, 
  Users, Package, Clock, GitBranch, BookOpen, Layers, ArrowRight,
  Check, X, Eye, FileText, ChevronRight, Sliders, ChevronDown
} from 'lucide-react';

export const ProjectOrganizationWorkspace: React.FC = () => {
  const { 
    project, setProject, aiConfig, setActiveTab 
  } = useSwriteStore();

  const theme = project.metadata.theme;

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [intelligenceResult, setIntelligenceResult] = useState<ProjectIntelligenceResult | null>(null);
  const [selectedProposalId, setSelectedProposalId] = useState<string | null>(null);
  const [domainFilter, setDomainFilter] = useState<OrganizationDomain | 'all'>('all');
  const [confidenceFilter, setConfidenceFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected' | 'applied'>('all');
  const [conflictsOnly, setConflictsOnly] = useState(false);
  const [duplicatesOnly, setDuplicatesOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<'local-deterministic' | 'local-llm' | 'cloud-llm'>('local-deterministic');
  const [lastAppliedSnapshotId, setLastAppliedSnapshotId] = useState<string | null>(null);
  const [appliedCountMessage, setAppliedCountMessage] = useState<string | null>(null);

  // Run full project analysis
  const handleRunAnalysis = async () => {
    setIsAnalyzing(true);
    setAppliedCountMessage(null);
    try {
      const provider = getOrganizationProvider(selectedProvider, {
        apiKey: aiConfig.apiKey,
        provider: aiConfig.provider === 'anthropic' || aiConfig.provider === 'openai' || aiConfig.provider === 'gemini' 
          ? aiConfig.provider 
          : 'gemini',
        modelName: aiConfig.model,
      });

      const result = await provider.analyzeProject(project);
      setIntelligenceResult(result);
      if (result.proposals.length > 0) {
        setSelectedProposalId(result.proposals[0].id);
      }
    } catch (e: any) {
      console.error('Project Intelligence Analysis Error:', e);
      alert(`Analysis failed: ${e.message || 'Unknown error'}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const proposals = useMemo(() => {
    return intelligenceResult?.proposals || [];
  }, [intelligenceResult]);

  const filteredProposals = useMemo(() => {
    return filterProposals(proposals, {
      domain: domainFilter,
      confidenceLevel: confidenceFilter,
      status: statusFilter,
      conflictsOnly,
      duplicatesOnly,
      searchQuery
    });
  }, [proposals, domainFilter, confidenceFilter, statusFilter, conflictsOnly, duplicatesOnly, searchQuery]);

  const stats = useMemo(() => {
    return getProposalStats(proposals);
  }, [proposals]);

  const selectedProposal = useMemo(() => {
    return proposals.find(p => p.id === selectedProposalId) || filteredProposals[0] || null;
  }, [proposals, selectedProposalId, filteredProposals]);

  // Proposal State Mutators (In-Memory Draft)
  const setProposalStatus = (id: string, status: 'accepted' | 'rejected' | 'pending') => {
    setIntelligenceResult(prev => {
      if (!prev) return null;
      return {
        ...prev,
        proposals: prev.proposals.map(p => p.id === id ? { ...p, status } : p)
      };
    });
  };

  const setDuplicateAction = (id: string, action: 'merge' | 'separate') => {
    setIntelligenceResult(prev => {
      if (!prev) return null;
      return {
        ...prev,
        proposals: prev.proposals.map(p => {
          if (p.id === id) {
            return {
              ...p,
              operation: action === 'merge' ? 'merge' : 'create',
              status: 'accepted'
            };
          }
          return p;
        })
      };
    });
  };

  const setConflictResolution = (proposalId: string, conflictIndex: number, choice: 'keep-existing' | 'update-canon' | 'create-revision-note' | 'ignore') => {
    setIntelligenceResult(prev => {
      if (!prev) return null;
      return {
        ...prev,
        proposals: prev.proposals.map(p => {
          if (p.id === proposalId && p.canonConflicts) {
            const updatedConflicts = [...p.canonConflicts];
            updatedConflicts[conflictIndex] = {
              ...updatedConflicts[conflictIndex],
              chosenResolution: choice
            };
            return {
              ...p,
              canonConflicts: updatedConflicts,
              status: 'accepted'
            };
          }
          return p;
        })
      };
    });
  };

  // Bulk Actions
  const handleAcceptAllHighConfidence = () => {
    setIntelligenceResult(prev => {
      if (!prev) return null;
      return {
        ...prev,
        proposals: prev.proposals.map(p => 
          p.confidenceLevel === 'high' && p.status === 'pending' 
            ? { ...p, status: 'accepted' } 
            : p
        )
      };
    });
  };

  const handleApplyApproved = () => {
    const approved = proposals.filter(p => p.status === 'accepted');
    if (approved.length === 0) {
      alert('No accepted proposals to apply. Click Accept on candidate items first.');
      return;
    }

    const { updatedProject, appliedCount, safetySnapshotId } = ProjectIntelligenceApplier.applyApprovedProposals(
      project, 
      approved
    );

    setProject(updatedProject);
    setLastAppliedSnapshotId(safetySnapshotId);
    setAppliedCountMessage(`Successfully applied ${appliedCount} proposals. Safety snapshot "${safetySnapshotId}" created.`);

    // Update status to applied
    setIntelligenceResult(prev => {
      if (!prev) return null;
      return {
        ...prev,
        proposals: prev.proposals.map(p => approved.some(a => a.id === p.id) ? { ...p, status: 'applied' } : p)
      };
    });
  };

  const handleRollback = () => {
    if (!lastAppliedSnapshotId) {
      alert('No recent organization snapshot found to rollback.');
      return;
    }

    const reverted = ProjectIntelligenceApplier.rollbackOrganization(project, lastAppliedSnapshotId);
    setProject(reverted);
    setAppliedCountMessage('Reverted project state to pre-organization snapshot.');
    setLastAppliedSnapshotId(null);
  };

  const getDomainIcon = (domain: OrganizationDomain) => {
    switch (domain) {
      case 'character': return <User className="w-3.5 h-3.5 text-indigo-400" />;
      case 'location': return <MapPin className="w-3.5 h-3.5 text-emerald-400" />;
      case 'faction': return <Users className="w-3.5 h-3.5 text-amber-400" />;
      case 'item': return <Package className="w-3.5 h-3.5 text-sky-400" />;
      case 'timeline': return <Clock className="w-3.5 h-3.5 text-purple-400" />;
      case 'plotThread': return <GitBranch className="w-3.5 h-3.5 text-rose-400" />;
      case 'outline': return <Layers className="w-3.5 h-3.5 text-cyan-400" />;
      case 'research': return <BookOpen className="w-3.5 h-3.5 text-teal-400" />;
      default: return <HelpCircle className="w-3.5 h-3.5 text-zinc-400" />;
    }
  };

  return (
    <div 
      className="flex-1 flex flex-col h-full overflow-hidden select-none font-sans"
      style={{ backgroundColor: theme.bg, color: theme.text }}
    >
      {/* 1. Header Toolbar */}
      <header 
        className="h-14 px-6 border-b flex items-center justify-between shrink-0"
        style={{ borderColor: theme.pageBorder, backgroundColor: theme.pageBg }}
      >
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <h2 className="font-serif font-bold text-sm text-zinc-100 tracking-tight">
              Project Intelligence & Universal Organization
            </h2>
          </div>

          <div className="h-4 w-[1px] bg-zinc-800" />

          {/* Provider Selector */}
          <div className="flex items-center space-x-1.5 text-xs text-zinc-400">
            <span>Engine:</span>
            <select
              value={selectedProvider}
              onChange={e => setSelectedProvider(e.target.value as any)}
              className="bg-zinc-900 border border-zinc-700 text-zinc-200 rounded px-2 py-0.5 text-xs focus:outline-none"
            >
              <option value="local-deterministic">Deterministic Local Engine (Offline)</option>
              <option value="local-llm">Local Offline LLM (Ollama)</option>
              <option value="cloud-llm">BYOK Cloud Model</option>
            </select>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center space-x-2.5">
          {lastAppliedSnapshotId && (
            <button
              onClick={handleRollback}
              className="flex items-center space-x-1.5 px-3 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-amber-300 text-xs font-medium transition-colors border border-amber-500/30"
              title="Revert to pre-organization safety snapshot"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Undo Last Batch</span>
            </button>
          )}

          <button
            onClick={handleRunAnalysis}
            disabled={isAnalyzing}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
            data-testid="btn-run-project-intelligence"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
            <span>{isAnalyzing ? 'Analyzing Entire Project...' : 'Analyze Project Intelligence'}</span>
          </button>
        </div>
      </header>

      {/* Applied Message Banner */}
      {appliedCountMessage && (
        <div className="bg-emerald-950/70 border-b border-emerald-800/80 px-6 py-2 flex items-center justify-between text-xs text-emerald-200">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{appliedCountMessage}</span>
          </div>
          <button onClick={() => setAppliedCountMessage(null)} className="text-emerald-400 hover:text-emerald-100">✕</button>
        </div>
      )}

      {/* 2. Domain & Filter Subheader */}
      <div 
        className="px-6 py-2 border-b flex flex-wrap items-center justify-between gap-3 text-xs shrink-0"
        style={{ borderColor: theme.pageBorder, backgroundColor: theme.pageBg }}
      >
        {/* Domain Tabs */}
        <div className="flex items-center space-x-1 overflow-x-auto py-0.5">
          {(['all', 'character', 'location', 'faction', 'item', 'timeline', 'plotThread', 'research', 'outline'] as const).map(domain => {
            const count = domain === 'all' ? stats.totalCount : stats.domainCounts[domain] || 0;
            const isSelected = domainFilter === domain && !conflictsOnly && !duplicatesOnly;

            return (
              <button
                key={domain}
                onClick={() => {
                  setDomainFilter(domain);
                  setConflictsOnly(false);
                  setDuplicatesOnly(false);
                }}
                className={`px-2.5 py-1 rounded text-xs flex items-center space-x-1.5 transition-colors whitespace-nowrap cursor-pointer ${
                  isSelected 
                    ? 'bg-zinc-800 text-zinc-100 font-semibold shadow-xs' 
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                }`}
              >
                {domain !== 'all' && getDomainIcon(domain as OrganizationDomain)}
                <span className="capitalize">{domain === 'plotThread' ? 'Plot Threads' : domain}</span>
                <span className="text-[10px] opacity-70 font-mono">({count})</span>
              </button>
            );
          })}

          <div className="h-3.5 w-[1px] bg-zinc-800 mx-1" />

          {/* Quick Filter: Canon Conflicts */}
          <button
            onClick={() => {
              setConflictsOnly(!conflictsOnly);
              setDuplicatesOnly(false);
            }}
            className={`px-2.5 py-1 rounded text-xs flex items-center space-x-1.5 transition-colors cursor-pointer ${
              conflictsOnly 
                ? 'bg-amber-950/80 text-amber-200 border border-amber-700/70 font-semibold' 
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            <span>Canon Conflicts ({stats.canonConflictsCount})</span>
          </button>

          {/* Quick Filter: Duplicates */}
          <button
            onClick={() => {
              setDuplicatesOnly(!duplicatesOnly);
              setConflictsOnly(false);
            }}
            className={`px-2.5 py-1 rounded text-xs flex items-center space-x-1.5 transition-colors cursor-pointer ${
              duplicatesOnly 
                ? 'bg-indigo-950/80 text-indigo-200 border border-indigo-700/70 font-semibold' 
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Users className="w-3 h-3 text-indigo-400" />
            <span>Possible Duplicates ({stats.duplicatesCount})</span>
          </button>
        </div>

        {/* Filter Controls & Search */}
        <div className="flex items-center space-x-2">
          {/* Confidence Filter */}
          <select
            value={confidenceFilter}
            onChange={e => setConfidenceFilter(e.target.value as any)}
            className="bg-zinc-900 border border-zinc-800 text-zinc-300 rounded px-2 py-1 text-xs"
          >
            <option value="all">All Confidence</option>
            <option value="high">High Confidence (≥85%)</option>
            <option value="medium">Medium Confidence (55-84%)</option>
            <option value="low">Needs Review (&lt;55%)</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="bg-zinc-900 border border-zinc-800 text-zinc-300 rounded px-2 py-1 text-xs"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
            <option value="applied">Applied</option>
          </select>

          {/* Search */}
          <div className="relative">
            <Search className="w-3 h-3 text-zinc-500 absolute left-2 top-2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search proposals..."
              className="pl-7 pr-2.5 py-1 bg-zinc-900 border border-zinc-800 text-zinc-200 placeholder-zinc-500 rounded text-xs w-36 focus:w-48 transition-all focus:outline-none focus:border-zinc-600"
            />
          </div>
        </div>
      </div>

      {/* 3. Main Split View: Proposals Feed & Inspector */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Column: Proposals List */}
        <section 
          className="w-1/2 border-r flex flex-col overflow-hidden"
          style={{ borderColor: theme.pageBorder }}
        >
          {/* Batch Actions Bar */}
          {proposals.length > 0 && (
            <div className="px-5 py-2.5 border-b border-zinc-800/60 flex items-center justify-between text-xs bg-zinc-900/30">
              <span className="text-zinc-400 font-mono text-[11px]">
                Showing {filteredProposals.length} of {proposals.length} proposals
              </span>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleAcceptAllHighConfidence}
                  className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-medium transition-colors cursor-pointer"
                >
                  Accept High-Confidence ({stats.highConfidenceCount})
                </button>

                <button
                  onClick={handleApplyApproved}
                  className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold transition-colors shadow-xs cursor-pointer"
                  data-testid="btn-apply-approved-proposals"
                >
                  Apply Approved ({stats.acceptedCount})
                </button>
              </div>
            </div>
          )}

          {/* Proposals Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
            {proposals.length === 0 ? (
              <div className="py-20 text-center space-y-3">
                <Sparkles className="w-10 h-10 text-indigo-400/40 mx-auto" />
                <h3 className="font-serif text-sm font-semibold text-zinc-200">
                  No Project Analysis Run Yet
                </h3>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
                  Click <strong>"Analyze Project Intelligence"</strong> to extract entities, detect duplicate characters, anchor chronological timeline events, and link story codex relationships across all acts and chapters.
                </p>
                <button
                  onClick={handleRunAnalysis}
                  disabled={isAnalyzing}
                  className="mt-2 px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs cursor-pointer"
                >
                  Start Universal Analysis
                </button>
              </div>
            ) : filteredProposals.length === 0 ? (
              <div className="py-16 text-center text-zinc-500 text-xs">
                No proposals match the current filter selection.
              </div>
            ) : (
              filteredProposals.map(proposal => {
                const isSelected = selectedProposal?.id === proposal.id;

                return (
                  <div
                    key={proposal.id}
                    onClick={() => setSelectedProposalId(proposal.id)}
                    className={`p-3.5 rounded-lg border transition-all cursor-pointer ${
                      isSelected 
                        ? 'bg-zinc-800/90 border-zinc-600 shadow-xs' 
                        : 'bg-zinc-900/40 border-zinc-800/70 hover:border-zinc-700 hover:bg-zinc-800/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        {getDomainIcon(proposal.domain)}
                        <span className="font-semibold text-xs text-zinc-100">{proposal.targetName}</span>
                        <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/60">
                          {proposal.operation}
                        </span>
                      </div>

                      {/* Confidence & Conflict Badges */}
                      <div className="flex items-center space-x-1.5">
                        {proposal.conflictsWithCanon && (
                          <span className="px-1.5 py-0.2 text-[10px] rounded bg-amber-950/80 text-amber-300 border border-amber-800/70 font-medium">
                            Canon Conflict
                          </span>
                        )}
                        {proposal.duplicateCandidate && (
                          <span className="px-1.5 py-0.2 text-[10px] rounded bg-indigo-950/80 text-indigo-300 border border-indigo-800/70 font-medium">
                            Possible Duplicate ({proposal.duplicateCandidate.similarityScore}%)
                          </span>
                        )}
                        <span className={`px-1.5 py-0.2 text-[10px] font-mono rounded ${
                          proposal.confidenceLevel === 'high' 
                            ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/50' 
                            : proposal.confidenceLevel === 'medium'
                            ? 'bg-amber-950/60 text-amber-300 border border-amber-800/50'
                            : 'bg-zinc-800 text-zinc-400'
                        }`}>
                          {Math.round(proposal.confidence * 100)}%
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-zinc-300 mt-1.5 leading-relaxed line-clamp-2">
                      {proposal.reasoning}
                    </p>

                    {/* Source References Provenance */}
                    {proposal.sourceReferences.length > 0 && (
                      <div className="mt-2 text-[11px] text-zinc-400 font-mono flex items-center space-x-1.5 truncate">
                        <FileText className="w-3 h-3 text-zinc-500 flex-shrink-0" />
                        <span className="truncate">
                          {proposal.sourceReferences[0].documentTitle}
                          {proposal.sourceReferences[0].paragraphIndex !== undefined ? ` • para ${proposal.sourceReferences[0].paragraphIndex + 1}` : ''}
                        </span>
                      </div>
                    )}

                    {/* Quick Inline Decision Buttons */}
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-zinc-800/50 text-xs">
                      <div className="text-[11px] font-mono">
                        Status: <strong className={`capitalize ${
                          proposal.status === 'accepted' ? 'text-emerald-400' :
                          proposal.status === 'rejected' ? 'text-rose-400' :
                          proposal.status === 'applied' ? 'text-cyan-400' : 'text-zinc-400'
                        }`}>{proposal.status}</strong>
                      </div>

                      <div className="flex items-center space-x-1.5" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => setProposalStatus(proposal.id, 'accepted')}
                          className={`px-2.5 py-0.5 rounded text-[11px] font-medium flex items-center space-x-1 transition-colors ${
                            proposal.status === 'accepted'
                              ? 'bg-emerald-600 text-white'
                              : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                          }`}
                        >
                          <Check className="w-3 h-3" />
                          <span>Accept</span>
                        </button>

                        <button
                          onClick={() => setProposalStatus(proposal.id, 'rejected')}
                          className={`px-2.5 py-0.5 rounded text-[11px] font-medium flex items-center space-x-1 transition-colors ${
                            proposal.status === 'rejected'
                              ? 'bg-rose-600 text-white'
                              : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                          }`}
                        >
                          <X className="w-3 h-3" />
                          <span>Reject</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Right Column: Detailed Inspector & Provenance Viewer */}
        <section 
          className="flex-1 overflow-y-auto p-6 space-y-6"
          style={{ backgroundColor: theme.pageBg }}
        >
          {selectedProposal ? (
            <div className="max-w-xl mx-auto space-y-6">
              {/* Proposal Header & Confidence */}
              <div className="border-b border-zinc-800 pb-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getDomainIcon(selectedProposal.domain)}
                    <span className="text-xs uppercase font-mono tracking-wider text-zinc-400">
                      {selectedProposal.domain} Proposal
                    </span>
                  </div>

                  <span className={`px-2 py-0.5 text-xs font-mono font-semibold rounded ${
                    selectedProposal.confidenceLevel === 'high' 
                      ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-800/60' 
                      : 'bg-amber-950/70 text-amber-300 border border-amber-800/60'
                  }`}>
                    {Math.round(selectedProposal.confidence * 100)}% Confidence
                  </span>
                </div>

                <h1 className="text-xl font-serif font-bold text-zinc-100">
                  {selectedProposal.targetName}
                </h1>

                <p className="text-xs text-zinc-300 leading-relaxed">
                  {selectedProposal.reasoning}
                </p>
              </div>

              {/* Duplicate Candidate Resolver */}
              {selectedProposal.duplicateCandidate && (
                <div className="p-4 rounded-lg border border-indigo-700/60 bg-indigo-950/30 space-y-3">
                  <div className="flex items-center space-x-2 text-indigo-300 text-xs font-semibold">
                    <Users className="w-4 h-4" />
                    <span>Possible Duplicate / Alias Detected</span>
                  </div>

                  <p className="text-xs text-zinc-300">
                    {selectedProposal.duplicateCandidate.evidence}
                  </p>

                  <div className="flex items-center space-x-2 pt-2">
                    <button
                      onClick={() => setDuplicateAction(selectedProposal.id, 'merge')}
                      className="px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors"
                    >
                      Merge as Alias under "{selectedProposal.duplicateCandidate.targetEntityName}"
                    </button>
                    <button
                      onClick={() => setDuplicateAction(selectedProposal.id, 'separate')}
                      className="px-3 py-1 rounded border border-zinc-700 hover:bg-zinc-800 text-zinc-300 text-xs transition-colors"
                    >
                      Keep as Separate Entity
                    </button>
                  </div>
                </div>
              )}

              {/* Canon Conflict Resolver */}
              {selectedProposal.canonConflicts && selectedProposal.canonConflicts.length > 0 && (
                <div className="p-4 rounded-lg border border-amber-700/60 bg-amber-950/30 space-y-3">
                  <div className="flex items-center space-x-2 text-amber-300 text-xs font-semibold">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Canon Conflict Detected</span>
                  </div>

                  {selectedProposal.canonConflicts.map((conflict, cIndex) => (
                    <div key={cIndex} className="space-y-2 text-xs">
                      <p className="text-zinc-300">{conflict.explanation}</p>
                      <div className="grid grid-cols-2 gap-2 bg-zinc-900/60 p-2.5 rounded border border-zinc-800">
                        <div>
                          <div className="text-[10px] uppercase text-zinc-500">Existing Canon</div>
                          <div className="font-semibold text-zinc-200 mt-0.5">{JSON.stringify(conflict.existingValue)}</div>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase text-amber-400">Detected Value</div>
                          <div className="font-semibold text-amber-200 mt-0.5">{JSON.stringify(conflict.detectedValue)}</div>
                        </div>
                      </div>

                      {/* Resolution Choice */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        <button
                          onClick={() => setConflictResolution(selectedProposal.id, cIndex, 'keep-existing')}
                          className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px]"
                        >
                          Keep Existing
                        </button>
                        <button
                          onClick={() => setConflictResolution(selectedProposal.id, cIndex, 'update-canon')}
                          className="px-2 py-0.5 rounded bg-amber-700 hover:bg-amber-600 text-white text-[11px] font-medium"
                        >
                          Update Canon
                        </button>
                        <button
                          onClick={() => setConflictResolution(selectedProposal.id, cIndex, 'create-revision-note')}
                          className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px]"
                        >
                          Create Revision Task
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Source Provenance Section (Mandatory Traceability) */}
              <div className="space-y-3">
                <div className="text-xs uppercase font-mono tracking-wider text-zinc-400 flex items-center space-x-1.5">
                  <FileText className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Source Text Provenance & Evidence ({selectedProposal.sourceReferences.length})</span>
                </div>

                <div className="space-y-2">
                  {selectedProposal.sourceReferences.map((ref, rIndex) => (
                    <div key={rIndex} className="p-3 rounded-lg border border-zinc-800/80 bg-zinc-900/50 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-zinc-400">
                        <strong className="text-zinc-200">{ref.documentTitle}</strong>
                        {ref.paragraphIndex !== undefined && (
                          <span className="font-mono">Paragraph #{ref.paragraphIndex + 1}</span>
                        )}
                      </div>

                      <blockquote className="text-xs font-serif italic text-zinc-300 pl-3 border-l-2 border-indigo-500/60 leading-relaxed">
                        {ref.snippet}
                      </blockquote>

                      <p className="text-[11px] text-zinc-500">
                        Reason: {ref.reason}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Proposed Extracted Data Attributes */}
              <div className="space-y-2 pt-2 border-t border-zinc-800">
                <div className="text-xs uppercase font-mono tracking-wider text-zinc-400">
                  Proposed Entity Attributes
                </div>
                <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800 text-xs font-mono text-zinc-300 space-y-1">
                  {Object.entries(selectedProposal.proposedData).map(([k, v]) => (
                    <div key={k} className="flex justify-between">
                      <span className="text-zinc-500">{k}:</span>
                      <span className="text-zinc-200 truncate max-w-xs">{JSON.stringify(v)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Primary Action Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-zinc-800">
                <button
                  onClick={() => setProposalStatus(selectedProposal.id, 'rejected')}
                  className="px-4 py-2 rounded-md border border-zinc-700 hover:bg-zinc-800 text-zinc-300 text-xs font-medium transition-colors"
                >
                  Reject Proposal
                </button>
                <button
                  onClick={() => setProposalStatus(selectedProposal.id, 'accepted')}
                  className="px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors shadow-xs"
                >
                  Accept Proposal
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-zinc-500">
              Select a proposal from the left to inspect its evidence and provenance.
            </div>
          )}
        </section>
      </main>
    </div>
  );
};
