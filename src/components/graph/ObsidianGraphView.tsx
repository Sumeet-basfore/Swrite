import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useSwriteStore } from '../../store/useSwriteStore';
import { ObsidianParserService } from '../../services/obsidianParserService';
import { GraphData, GraphNode, GraphLink, GraphPhysicsConfig, StoryGraphMode } from '../../types';
import { 
  Network, Search, ZoomIn, ZoomOut, RotateCcw, Filter, 
  Layers, Users, BookOpen, Tag, Compass,
  SlidersHorizontal, X, ArrowRight, ExternalLink, FileText,
  Flame, CircleDot, Eye, Maximize2, Link2, PlusCircle,
  GitBranch, MapPin, Brain, ShieldAlert, ShieldCheck, Clock
} from 'lucide-react';

interface SimulatedNode extends GraphNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  fixed?: boolean;
}

interface ObsidianGraphViewProps {
  isEmbeddedSplit?: boolean;
  onCloseSplit?: () => void;
}

export const ObsidianGraphView: React.FC<ObsidianGraphViewProps> = ({
  isEmbeddedSplit = false,
  onCloseSplit
}) => {
  const { 
    project, activeChapterId, setActiveChapterId, setActiveSceneId, setActiveTab,
    addCharacterRelationship, deleteCharacterRelationship
  } = useSwriteStore();
  const theme = project.metadata.theme;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Physics & Layout Configuration (Wide, calm, uncluttered defaults)
  const [physicsConfig, setPhysicsConfig] = useState<GraphPhysicsConfig>({
    repelForce: 3200,
    linkDistance: 130,
    centerGravity: 0.0025,
    nodeScale: 0.95,
    showArrows: true,
    showOrphans: true,
    showLabels: false, // Clean LOD: hover & hubs by default
    layoutMode: 'force',
    scope: 'global',
    localDepth: 1,
  });

  const [isPhysicsDeckOpen, setIsPhysicsDeckOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  // Interactive Connection Mode
  const [isConnectMode, setIsConnectMode] = useState(false);
  const [connectSourceNode, setConnectSourceNode] = useState<SimulatedNode | null>(null);
  const [connectMousePos, setConnectMousePos] = useState<{ x: number; y: number } | null>(null);
  const [newRelationModal, setNewRelationModal] = useState<{
    isOpen: boolean;
    source: SimulatedNode | null;
    target: SimulatedNode | null;
    relation: string;
  }>({
    isOpen: false,
    source: null,
    target: null,
    relation: 'Allies',
  });

  // Story Graph Modes & Filters
  const [graphMode, setGraphMode] = useState<StoryGraphMode>('story');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTypes, setFilterTypes] = useState<Record<string, boolean>>({
    chapter: true,
    character: true,
    act: true,
    scene: true,
    location: true,
    faction: true,
    plotThread: true,
    event: true,
    knowledge: true,
    storyArc: true,
    lore: true,
    beat: true,
  });

  // Camera & Simulation State
  const cameraRef = useRef({ x: 0, y: 0, zoom: 0.85 });
  const isDraggingCanvasRef = useRef(false);
  const dragNodeRef = useRef<SimulatedNode | null>(null);
  const dragStartPosRef = useRef({ x: 0, y: 0 });
  const hoveredNodeRef = useRef<SimulatedNode | null>(null);
  const nodesRef = useRef<SimulatedNode[]>([]);
  const linksRef = useRef<GraphLink[]>([]);
  const animFrameRef = useRef<number | null>(null);
  const alphaRef = useRef(1.0);

  const reheatSimulation = (amount = 0.5) => {
    alphaRef.current = Math.max(alphaRef.current, amount);
  };

  // Generate Graph Data based on active graphMode
  const graphData = useMemo(() => {
    return ObsidianParserService.generateGraphData(
      project,
      physicsConfig.scope,
      activeChapterId,
      physicsConfig.localDepth,
      graphMode
    );
  }, [project, physicsConfig.scope, activeChapterId, physicsConfig.localDepth, graphMode]);

  // Initialize and disperse nodes with golden-spiral distribution
  useEffect(() => {
    const rawGraph = graphData;
    const totalNodes = rawGraph.nodes.length;

    const existingMap = new Map<string, { x: number; y: number; vx: number; vy: number }>();
    nodesRef.current.forEach(n => {
      existingMap.set(n.id, { x: n.x, y: n.y, vx: n.vx, vy: n.vy });
    });

    // Golden spiral spread radius
    const baseRadius = Math.max(280, Math.sqrt(totalNodes) * 55);

    nodesRef.current = rawGraph.nodes.map((n, i) => {
      const existing = existingMap.get(n.id);
      let initX = existing ? existing.x : 0;
      let initY = existing ? existing.y : 0;

      if (physicsConfig.layoutMode === 'spine') {
        if (n.type === 'act') {
          const actIndex = project.acts.findIndex(a => a.id === n.id);
          initX = (actIndex - project.acts.length / 2) * 440;
          initY = -180;
        } else if (n.type === 'chapter') {
          let globalChIdx = 0;
          let found = false;
          for (const act of project.acts) {
            for (const ch of act.chapters) {
              if (ch.id === n.id) {
                found = true;
                break;
              }
              globalChIdx++;
            }
            if (found) break;
          }
          initX = (globalChIdx - (totalNodes / 4)) * 140;
          initY = 0 + ((globalChIdx % 2 === 0) ? -20 : 20);
        } else if (n.type === 'character') {
          const charIdx = project.characters.findIndex(c => c.id === n.id);
          initX = (charIdx - project.characters.length / 2) * 120;
          initY = 160 + (charIdx % 3) * 40;
        } else if (n.type === 'beat') {
          initX = (i - totalNodes / 2) * 85;
          initY = -100;
        } else {
          initX = (i - totalNodes / 2) * 90;
          initY = 220;
        }
      } else if (physicsConfig.layoutMode === 'radial') {
        if (n.type === 'act') {
          const actIdx = project.acts.findIndex(a => a.id === n.id);
          const angle = (actIdx / Math.max(1, project.acts.length)) * Math.PI * 2;
          initX = Math.cos(angle) * 120;
          initY = Math.sin(angle) * 120;
        } else if (n.type === 'chapter') {
          const angle = (i / Math.max(1, totalNodes)) * Math.PI * 2;
          initX = Math.cos(angle) * 280;
          initY = Math.sin(angle) * 280;
        } else {
          const angle = (i / Math.max(1, totalNodes)) * Math.PI * 2;
          initX = Math.cos(angle) * 440;
          initY = Math.sin(angle) * 440;
        }
      } else {
        // Wide Spiral distribution to prevent initial ball clumping
        if (!existing) {
          const phi = i * 2.399963; // Golden angle
          const r = Math.sqrt(i + 1) * (baseRadius / Math.sqrt(totalNodes + 1));
          initX = Math.cos(phi) * r;
          initY = Math.sin(phi) * r;
        }
      }

      return {
        ...n,
        x: initX,
        y: initY,
        vx: existing ? existing.vx : (Math.random() - 0.5) * 1.0,
        vy: existing ? existing.vy : (Math.random() - 0.5) * 1.0,
        radius: Math.max(5, n.val * 0.7 * physicsConfig.nodeScale),
      };
    });

    linksRef.current = rawGraph.links;
    alphaRef.current = 1.0;
  }, [graphData, physicsConfig.layoutMode, physicsConfig.nodeScale, project]);

  // Physics Simulation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isRunning = true;

    const tick = () => {
      if (!isRunning) return;

      const nodes = nodesRef.current;
      const links = linksRef.current;
      const alpha = alphaRef.current;
      const isSpine = physicsConfig.layoutMode === 'spine';

      // 1. Force Simulation
      if (alpha > 0.002 || dragNodeRef.current) {
        const repelMultiplier = physicsConfig.repelForce * alpha;

        // Repulsion + Strong Anti-Overlap
        for (let i = 0; i < nodes.length; i++) {
          for (let j = i + 1; j < nodes.length; j++) {
            const n1 = nodes[i];
            const n2 = nodes[j];
            const dx = n2.x - n1.x;
            const dy = n2.y - n1.y;
            const distSq = dx * dx + dy * dy || 1;
            const dist = Math.sqrt(distSq);

            // Generous anti-overlap buffer so nodes never collide
            const minSpacing = n1.radius + n2.radius + 32;
            if (dist < minSpacing) {
              const overlap = (minSpacing - dist) * 0.45;
              const pushX = (dx / dist) * overlap;
              const pushY = (dy / dist) * overlap;

              if (n1 !== dragNodeRef.current) {
                n1.x -= pushX;
                n1.y -= pushY;
              }
              if (n2 !== dragNodeRef.current) {
                n2.x += pushX;
                n2.y += pushY;
              }
            }

            // Normal long-range repulsion
            if (dist < (isSpine ? 260 : 450)) {
              const force = repelMultiplier / distSq;
              const fx = (dx / dist) * force;
              const fy = (dy / dist) * force;

              if (n1 !== dragNodeRef.current) {
                n1.vx -= fx;
                n1.vy -= isSpine ? fy * 0.3 : fy;
              }
              if (n2 !== dragNodeRef.current) {
                n2.vx += fx;
                n2.vy += isSpine ? fy * 0.3 : fy;
              }
            }
          }
        }

        // Link Attraction
        const targetDist = physicsConfig.linkDistance;
        links.forEach(link => {
          const source = nodes.find(n => n.id === link.source);
          const target = nodes.find(n => n.id === link.target);
          if (!source || !target) return;

          const dx = target.x - source.x;
          const dy = target.y - source.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = (dist - targetDist) * (isSpine ? 0.05 : 0.035) * alpha;

          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;

          if (source !== dragNodeRef.current) {
            source.vx += fx;
            source.vy += isSpine ? fy * 0.3 : fy;
          }
          if (target !== dragNodeRef.current) {
            target.vx -= fx;
            target.vy -= isSpine ? fy * 0.3 : fy;
          }
        });

        // Center Gravity & Velocity Clamping
        const gravity = physicsConfig.centerGravity * alpha;
        const maxSpeed = 10;

        nodes.forEach(n => {
          if (n !== dragNodeRef.current) {
            n.vx -= n.x * gravity;
            n.vy -= n.y * (isSpine ? gravity * 1.5 : gravity);

            const speed = Math.sqrt(n.vx * n.vx + n.vy * n.vy);
            if (speed > maxSpeed) {
              n.vx = (n.vx / speed) * maxSpeed;
              n.vy = (n.vy / speed) * maxSpeed;
            }

            n.vx *= 0.86;
            n.vy *= 0.86;
            n.x += n.vx;
            n.y += n.vy;
          }
        });

        alphaRef.current *= 0.993;
      }

      // 2. High-DPI Render Step
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      
      if (canvas.width !== Math.floor(rect.width * dpr) || canvas.height !== Math.floor(rect.height * dpr)) {
        canvas.width = Math.floor(rect.width * dpr);
        canvas.height = Math.floor(rect.height * dpr);
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, rect.width, rect.height);

      ctx.translate(rect.width / 2 + cameraRef.current.x, rect.height / 2 + cameraRef.current.y);
      ctx.scale(cameraRef.current.zoom, cameraRef.current.zoom);

      const hovered = hoveredNodeRef.current;
      const active = selectedNode;
      const focusTarget = hovered || active;

      // Draw Links (Atmospheric, ultra-clean)
      links.forEach(link => {
        const source = nodes.find(n => n.id === link.source);
        const target = nodes.find(n => n.id === link.target);
        if (!source || !target) return;

        if (!filterTypes[source.type] || !filterTypes[target.type]) return;

        const isConnectedToFocus = focusTarget && (source.id === focusTarget.id || target.id === focusTarget.id);

        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);

        if (focusTarget) {
          if (isConnectedToFocus) {
            ctx.strokeStyle = '#818CF8';
            ctx.lineWidth = 1.8;
            ctx.globalAlpha = 0.95;
          } else {
            // Fade unrelated links into background
            ctx.strokeStyle = theme.isDark ? 'rgba(70, 70, 90, 0.08)' : 'rgba(200, 200, 215, 0.12)';
            ctx.lineWidth = 0.4;
            ctx.globalAlpha = 0.06;
          }
        } else {
          // Default starry view: very fine, subtle lines
          if (link.type === 'sequence') {
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
            ctx.lineWidth = 1.0;
            ctx.globalAlpha = 0.5;
          } else if (link.type === 'character') {
            ctx.strokeStyle = 'rgba(245, 158, 11, 0.22)';
            ctx.lineWidth = 0.7;
            ctx.globalAlpha = 0.35;
          } else {
            ctx.strokeStyle = theme.isDark ? 'rgba(120, 120, 140, 0.18)' : 'rgba(140, 140, 160, 0.22)';
            ctx.lineWidth = 0.5;
            ctx.globalAlpha = 0.25;
          }
        }

        ctx.stroke();
        ctx.globalAlpha = 1.0;

        // Relationship label ONLY shown when link or node is explicitly focused
        if (link.label && isConnectedToFocus) {
          const midX = (source.x + target.x) / 2;
          const midY = (source.y + target.y) / 2;
          ctx.save();
          ctx.font = '600 10px "Plus Jakarta Sans", sans-serif';
          ctx.fillStyle = '#C7D2FE';
          ctx.textAlign = 'center';
          
          // Small pill background for readability
          ctx.fillStyle = 'rgba(15, 15, 20, 0.85)';
          const textWidth = ctx.measureText(link.label).width;
          ctx.fillRect(midX - textWidth / 2 - 4, midY - 12, textWidth + 8, 14);
          
          ctx.fillStyle = '#A5B4FC';
          ctx.fillText(link.label, midX, midY - 2);
          ctx.restore();
        }

        // Directional Arrows on chronological sequence links
        if (physicsConfig.showArrows && (link.isDirectional || link.type === 'sequence')) {
          const dx = target.x - source.x;
          const dy = target.y - source.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 20) {
            const unitX = dx / dist;
            const unitY = dy / dist;

            const arrowDist = target.radius + 7;
            const arrowX = target.x - unitX * arrowDist;
            const arrowY = target.y - unitY * arrowDist;

            const arrowSize = 4.5;
            ctx.beginPath();
            ctx.moveTo(arrowX, arrowY);
            ctx.lineTo(
              arrowX - unitX * arrowSize - unitY * (arrowSize * 0.55),
              arrowY - unitY * arrowSize + unitX * (arrowSize * 0.55)
            );
            ctx.lineTo(
              arrowX - unitX * arrowSize + unitY * (arrowSize * 0.55),
              arrowY - unitY * arrowSize - unitX * (arrowSize * 0.55)
            );
            ctx.closePath();
            ctx.fillStyle = isConnectedToFocus ? '#818CF8' : 'rgba(56, 189, 248, 0.5)';
            ctx.fill();
          }
        }
      });

      // Rubber-band Connection Line
      if (connectSourceNode && connectMousePos) {
        ctx.save();
        ctx.beginPath();
        ctx.setLineDash([4, 4]);
        ctx.moveTo(connectSourceNode.x, connectSourceNode.y);
        ctx.lineTo(connectMousePos.x, connectMousePos.y);
        ctx.strokeStyle = '#C084FC';
        ctx.lineWidth = 1.8;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(connectMousePos.x, connectMousePos.y, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = '#C084FC';
        ctx.fill();
        ctx.restore();
      }

      // Draw Nodes
      nodes.forEach(node => {
        if (!filterTypes[node.type]) return;

        const isHovered = hovered && hovered.id === node.id;
        const isSelected = selectedNode && selectedNode.id === node.id;
        const isConnectSource = connectSourceNode && connectSourceNode.id === node.id;
        const isActiveCh = node.id === activeChapterId;
        const isConnected = focusTarget && links.some(l => 
          (l.source === focusTarget.id && l.target === node.id) ||
          (l.target === focusTarget.id && l.source === node.id)
        );

        const isMatch = searchTerm ? node.label.toLowerCase().includes(searchTerm.toLowerCase()) : true;

        ctx.save();
        ctx.beginPath();
        const displayRadius = node.radius * (isHovered || isSelected || isConnectSource ? 1.3 : 1);
        ctx.arc(node.x, node.y, displayRadius, 0, Math.PI * 2);

        ctx.fillStyle = node.color || '#818CF8';
        if (focusTarget && !isHovered && !isSelected && !isConnected && !isConnectSource) {
          ctx.globalAlpha = 0.15;
        } else if (!isMatch) {
          ctx.globalAlpha = 0.10;
        } else {
          ctx.globalAlpha = 0.95;
        }

        ctx.fill();

        // Highlighting Ring
        if (isHovered || isSelected || isConnectSource || isActiveCh || (searchTerm && isMatch)) {
          ctx.lineWidth = isSelected || isConnectSource || isActiveCh ? 2.5 : 1.8;
          ctx.strokeStyle = isConnectSource ? '#C084FC' : (isActiveCh ? '#38BDF8' : '#FFFFFF');
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(node.x, node.y, displayRadius + 3.5, 0, Math.PI * 2);
          ctx.lineWidth = 1.0;
          ctx.strokeStyle = isConnectSource ? 'rgba(192, 132, 252, 0.4)' : (isActiveCh ? 'rgba(56, 189, 248, 0.4)' : 'rgba(255, 255, 255, 0.35)');
          ctx.stroke();
        }

        // Intelligent Label LOD: Only render when relevant to keep canvas crystal clear
        const shouldShowLabel = 
          physicsConfig.showLabels ||
          isHovered || 
          isSelected || 
          isConnectSource ||
          isConnected || 
          isActiveCh || 
          cameraRef.current.zoom > 1.25 || 
          node.type === 'act' || 
          (searchTerm && isMatch);

        if (shouldShowLabel) {
          const fontSize = isHovered || isSelected || isConnectSource ? 11 : (node.type === 'act' ? 11 : 10);
          ctx.font = `${isHovered || isSelected || isConnectSource || node.type === 'act' ? '600' : '500'} ${fontSize}px "Plus Jakarta Sans", sans-serif`;
          ctx.fillStyle = isHovered || isSelected || isConnectSource ? '#FFFFFF' : (theme.isDark ? '#E4E4E7' : '#27272A');
          ctx.textAlign = 'center';

          ctx.strokeStyle = theme.isDark ? '#09090B' : '#FFFFFF';
          ctx.lineWidth = 2.5;
          ctx.strokeText(node.label, node.x, node.y + displayRadius + 12);
          ctx.fillText(node.label, node.x, node.y + displayRadius + 12);

          if ((isHovered || isSelected) && (node.wordCount || node.subType)) {
            const sub = node.type === 'chapter' ? `${node.wordCount} words` : node.subType;
            if (sub) {
              ctx.font = '9px "Plus Jakarta Sans", sans-serif';
              ctx.fillStyle = theme.isDark ? '#A1A1AA' : '#71717A';
              ctx.fillText(sub, node.x, node.y + displayRadius + 23);
            }
          }
        }

        ctx.restore();
      });

      ctx.restore();

      animFrameRef.current = requestAnimationFrame(tick);
    };

    tick();

    return () => {
      isRunning = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [
    graphData, 
    filterTypes, 
    searchTerm, 
    theme, 
    physicsConfig, 
    selectedNode, 
    activeChapterId,
    connectSourceNode,
    connectMousePos
  ]);

  // Pointer Handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    reheatSimulation(0.6);

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left - (rect.width / 2 + cameraRef.current.x);
    const mouseY = e.clientY - rect.top - (rect.height / 2 + cameraRef.current.y);

    const worldX = mouseX / cameraRef.current.zoom;
    const worldY = mouseY / cameraRef.current.zoom;

    const clickedNode = nodesRef.current.find(n => {
      if (!filterTypes[n.type]) return false;
      const dx = n.x - worldX;
      const dy = n.y - worldY;
      return Math.sqrt(dx * dx + dy * dy) <= n.radius + 8;
    });

    if (isConnectMode || e.shiftKey) {
      if (clickedNode) {
        setConnectSourceNode(clickedNode);
        setConnectMousePos({ x: worldX, y: worldY });
      }
      return;
    }

    if (clickedNode) {
      dragNodeRef.current = clickedNode;
      setSelectedNode(clickedNode);
    } else {
      isDraggingCanvasRef.current = true;
      dragStartPosRef.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left - (rect.width / 2 + cameraRef.current.x);
    const mouseY = e.clientY - rect.top - (rect.height / 2 + cameraRef.current.y);

    const worldX = mouseX / cameraRef.current.zoom;
    const worldY = mouseY / cameraRef.current.zoom;

    if (connectSourceNode) {
      setConnectMousePos({ x: worldX, y: worldY });
      return;
    }

    if (dragNodeRef.current) {
      dragNodeRef.current.x = worldX;
      dragNodeRef.current.y = worldY;
      dragNodeRef.current.vx = 0;
      dragNodeRef.current.vy = 0;
      reheatSimulation(0.3);
    } else if (isDraggingCanvasRef.current) {
      const dx = e.clientX - dragStartPosRef.current.x;
      const dy = e.clientY - dragStartPosRef.current.y;
      cameraRef.current.x += dx;
      cameraRef.current.y += dy;
      dragStartPosRef.current = { x: e.clientX, y: e.clientY };
    } else {
      const found = nodesRef.current.find(n => {
        if (!filterTypes[n.type]) return false;
        const dx = n.x - worldX;
        const dy = n.y - worldY;
        return Math.sqrt(dx * dx + dy * dy) <= n.radius + 8;
      });
      hoveredNodeRef.current = found || null;
      canvas.style.cursor = found ? 'pointer' : 'default';
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (connectSourceNode) {
      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left - (rect.width / 2 + cameraRef.current.x);
        const mouseY = e.clientY - rect.top - (rect.height / 2 + cameraRef.current.y);
        const worldX = mouseX / cameraRef.current.zoom;
        const worldY = mouseY / cameraRef.current.zoom;

        const targetNode = nodesRef.current.find(n => {
          if (!filterTypes[n.type]) return false;
          if (n.id === connectSourceNode.id) return false;
          const dx = n.x - worldX;
          const dy = n.y - worldY;
          return Math.sqrt(dx * dx + dy * dy) <= n.radius + 12;
        });

        if (targetNode) {
          setNewRelationModal({
            isOpen: true,
            source: connectSourceNode,
            target: targetNode,
            relation: 'Allies',
          });
        }
      }
      setConnectSourceNode(null);
      setConnectMousePos(null);
      return;
    }

    dragNodeRef.current = null;
    isDraggingCanvasRef.current = false;
  };

  const handleDoubleClick = () => {
    if (selectedNode) {
      if (selectedNode.type === 'chapter' && selectedNode.targetId) {
        setActiveChapterId(selectedNode.targetId);
        setActiveTab('editor');
      } else if (selectedNode.type === 'character') {
        setActiveTab('partner');
      }
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.12 : 0.88;
    cameraRef.current.zoom = Math.max(0.2, Math.min(3.0, cameraRef.current.zoom * zoomFactor));
  };

  const resetCamera = () => {
    cameraRef.current = { x: 0, y: 0, zoom: 0.85 };
    setSelectedNode(null);
    reheatSimulation(0.8);
  };

  const toggleFilter = (type: string) => {
    setFilterTypes(prev => ({ ...prev, [type]: !prev[type] }));
    reheatSimulation(0.5);
  };

  const handleOpenSelectedNode = () => {
    if (!selectedNode) return;
    if (selectedNode.type === 'chapter' && selectedNode.targetId) {
      setActiveChapterId(selectedNode.targetId);
      setActiveTab('editor');
    } else if (selectedNode.type === 'scene') {
      if (selectedNode.targetId) setActiveChapterId(selectedNode.targetId);
      if (selectedNode.id) setActiveSceneId(selectedNode.id);
      setActiveTab('editor');
    } else if (selectedNode.type === 'character') {
      setActiveTab('codex');
    } else if (selectedNode.type === 'location' || selectedNode.type === 'faction' || selectedNode.type === 'lore') {
      setActiveTab('codex');
    } else if (selectedNode.type === 'plotThread' || selectedNode.type === 'storyArc') {
      setActiveTab('threads');
    } else if (selectedNode.type === 'event') {
      setActiveTab('timeline');
    }
  };

  const handleCreateRelationship = () => {
    if (newRelationModal.source && newRelationModal.target) {
      addCharacterRelationship(
        newRelationModal.source.id,
        newRelationModal.target.id,
        newRelationModal.relation
      );
      setNewRelationModal({ isOpen: false, source: null, target: null, relation: 'Allies' });
      reheatSimulation(0.8);
    }
  };

  const currentFilterPills = useMemo(() => {
    if (graphMode === 'characters') {
      return [
        { id: 'character', label: 'Characters', color: '#F59E0B' },
        { id: 'scene', label: 'Scenes', color: '#10B981' },
        { id: 'event', label: 'Events', color: '#F43F5E' },
      ];
    }
    if (graphMode === 'threads') {
      return [
        { id: 'plotThread', label: 'Threads', color: '#A855F7' },
        { id: 'storyArc', label: 'Arcs', color: '#818CF8' },
        { id: 'scene', label: 'Scenes', color: '#10B981' },
        { id: 'character', label: 'Cast', color: '#F59E0B' },
        { id: 'location', label: 'Settings', color: '#14B8A6' },
      ];
    }
    if (graphMode === 'locations') {
      return [
        { id: 'location', label: 'Locations', color: '#14B8A6' },
        { id: 'faction', label: 'Factions', color: '#F97316' },
        { id: 'character', label: 'Cast', color: '#F59E0B' },
        { id: 'lore', label: 'Lore', color: '#34D399' },
      ];
    }
    if (graphMode === 'knowledge') {
      return [
        { id: 'character', label: 'Characters', color: '#F59E0B' },
        { id: 'knowledge', label: 'Facts & Secrets', color: '#EAB308' },
      ];
    }
    return [
      { id: 'chapter', label: 'Chapters', color: '#38BDF8' },
      { id: 'character', label: 'Characters', color: '#F59E0B' },
      { id: 'act', label: 'Acts', color: '#818CF8' },
      { id: 'lore', label: 'Lore', color: '#34D399' },
      { id: 'beat', label: 'Beats', color: '#FB7185' },
    ];
  }, [graphMode]);

  return (
    <div 
      className="flex-1 flex flex-col h-full overflow-hidden select-none text-xs relative"
      style={{ backgroundColor: theme.bg, color: theme.text }}
    >
      {/* Top Graph HUD Controls */}
      <div 
        className="h-11 border-b flex items-center justify-between px-3 sm:px-5 select-none z-20 shrink-0 gap-2"
        style={{ borderColor: theme.pageBorder, backgroundColor: theme.pageBg }}
      >
        <div className="flex items-center space-x-2.5">
          {/* Graph Mode Segmented Switcher */}
          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-0.5 text-[11px]">
            {[
              { id: 'story', label: 'Story', icon: BookOpen },
              { id: 'characters', label: 'Characters', icon: Users },
              { id: 'threads', label: 'Threads', icon: GitBranch },
              { id: 'locations', label: 'World', icon: MapPin },
              { id: 'knowledge', label: 'Knowledge', icon: Brain },
            ].map(m => {
              const Icon = m.icon;
              const isActive = graphMode === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => {
                    setGraphMode(m.id as StoryGraphMode);
                    reheatSimulation(0.9);
                  }}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all flex items-center space-x-1.5 ${
                    isActive 
                      ? 'bg-indigo-600 text-white shadow-xs font-semibold' 
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                  }`}
                  title={`${m.label} Graph Mode`}
                >
                  <Icon className="w-3 h-3" />
                  <span className="hidden sm:inline">{m.label}</span>
                </button>
              );
            })}
          </div>

          {/* Scope Selector */}
          <div className="hidden xl:flex items-center bg-zinc-800/80 border border-zinc-700/60 rounded p-0.5 text-[10px]">
            <button
              onClick={() => {
                setPhysicsConfig(prev => ({ ...prev, scope: 'global' }));
                reheatSimulation(0.8);
              }}
              className={`px-2 py-0.5 rounded font-medium transition-colors ${
                physicsConfig.scope === 'global' ? 'bg-zinc-700 text-zinc-100 shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Universe
            </button>
            <button
              onClick={() => {
                setPhysicsConfig(prev => ({ ...prev, scope: 'local' }));
                reheatSimulation(0.8);
              }}
              className={`px-2 py-0.5 rounded font-medium transition-colors ${
                physicsConfig.scope === 'local' ? 'bg-zinc-700 text-zinc-100 shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Focus 1-2 hops around current chapter"
            >
              Radar
            </button>
          </div>
        </div>

        {/* Dynamic Filter Badges for Active Mode */}
        {!isEmbeddedSplit && (
          <div className="hidden lg:flex items-center space-x-1">
            {currentFilterPills.map(f => (
              <button
                key={f.id}
                onClick={() => toggleFilter(f.id)}
                className={`flex items-center space-x-1 px-2 py-0.5 rounded border text-[10px] font-medium transition-colors ${
                  filterTypes[f.id] ?? true
                    ? 'border-zinc-700 bg-zinc-800/90 text-zinc-200' 
                    : 'border-transparent text-zinc-600 opacity-40 hover:opacity-70'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: f.color }} />
                <span>{f.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Connect Tool, Search, Physics Deck, & Zoom Utilities */}
        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => setIsConnectMode(!isConnectMode)}
            className={`px-2 py-1 rounded border text-[11px] font-medium transition-colors flex items-center space-x-1 ${
              isConnectMode
                ? 'bg-purple-600 border-purple-500 text-white shadow'
                : 'bg-zinc-800/80 border-zinc-700 text-zinc-300 hover:text-white'
            }`}
            title="Connect characters or nodes (or hold Shift and drag)"
          >
            <Link2 className="w-3 h-3" />
            <span className="hidden sm:inline">Connect</span>
          </button>

          <div className="relative">
            <Search className="w-3 h-3 absolute left-2 top-2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                reheatSimulation(0.3);
              }}
              className="bg-[#121215] border border-zinc-700/80 rounded pl-7 pr-2 py-0.5 text-xs text-zinc-200 w-20 sm:w-32 outline-none focus:border-indigo-500 focus:w-36 transition-all"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                className="absolute right-1.5 top-1.5 text-zinc-500 hover:text-white"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            )}
          </div>

          <button
            onClick={() => setIsPhysicsDeckOpen(!isPhysicsDeckOpen)}
            className={`p-1 rounded border transition-colors flex items-center space-x-1 text-xs ${
              isPhysicsDeckOpen 
                ? 'bg-indigo-600 border-indigo-500 text-white' 
                : 'bg-zinc-800/80 border-zinc-700 text-zinc-300 hover:text-white'
            }`}
            title="Graph Physics & Layout Settings"
          >
            <SlidersHorizontal className="w-3 h-3" />
            <span className="hidden md:inline text-[10px] font-medium">Physics</span>
          </button>

          <div className="flex items-center border border-zinc-700/80 rounded bg-zinc-800/60 p-0.5">
            <button
              onClick={() => { cameraRef.current.zoom = Math.min(3.0, cameraRef.current.zoom * 1.15); }}
              className="p-1 hover:bg-zinc-700 rounded text-zinc-400 hover:text-white"
              title="Zoom In"
            >
              <ZoomIn className="w-3 h-3" />
            </button>
            <button
              onClick={() => { cameraRef.current.zoom = Math.max(0.2, cameraRef.current.zoom * 0.85); }}
              className="p-1 hover:bg-zinc-700 rounded text-zinc-400 hover:text-white"
              title="Zoom Out"
            >
              <ZoomOut className="w-3 h-3" />
            </button>
            <button
              onClick={resetCamera}
              className="p-1 hover:bg-zinc-700 rounded text-zinc-400 hover:text-white"
              title="Reset View"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>

          {isEmbeddedSplit && onCloseSplit && (
            <button
              onClick={onCloseSplit}
              className="p-1 hover:text-zinc-200 text-zinc-400 hover:bg-zinc-800 rounded transition-colors ml-1"
              title="Close Split View"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Interactive Graph Canvas */}
      <div className="flex-1 w-full h-full relative cursor-grab active:cursor-grabbing overflow-hidden">
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onDoubleClick={handleDoubleClick}
          onWheel={handleWheel}
          className="w-full h-full block"
        />

        {/* Floating Connection Mode Banner */}
        {isConnectMode && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-purple-950/90 border border-purple-500/80 text-purple-200 px-3 py-1 rounded-full text-[11px] shadow-lg flex items-center space-x-2 pointer-events-none animate-in fade-in">
            <Link2 className="w-3 h-3 text-purple-300" />
            <span>Click & drag from one node to another to create relationship</span>
          </div>
        )}

        {/* Floating Obsidian-Style Physics Deck Settings HUD */}
        {isPhysicsDeckOpen && (
          <div 
            className="absolute top-3 right-4 sm:right-6 w-64 sm:w-72 bg-[#18181B]/95 backdrop-blur-md border border-zinc-700/80 rounded-xl shadow-2xl p-3.5 text-xs z-30 animate-in fade-in slide-in-from-top-2 duration-150"
          >
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800 mb-2.5">
              <div className="flex items-center space-x-2 font-semibold text-zinc-100">
                <Compass className="w-3.5 h-3.5 text-indigo-400" />
                <span>Physics & Layout</span>
              </div>
              <button 
                onClick={() => setIsPhysicsDeckOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Layout Mode Presets */}
            <div className="mb-3">
              <label className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider block mb-1">
                Layout Arrangement
              </label>
              <div className="grid grid-cols-3 gap-1 bg-zinc-900/90 p-1 rounded-lg border border-zinc-800">
                {[
                  { id: 'force', label: 'Galaxy' },
                  { id: 'spine', label: 'Spine' },
                  { id: 'radial', label: 'Radial' },
                ].map(mode => (
                  <button
                    key={mode.id}
                    onClick={() => {
                      setPhysicsConfig(prev => ({ ...prev, layoutMode: mode.id as any }));
                      reheatSimulation(1.0);
                    }}
                    className={`py-1 text-[10px] font-medium rounded transition-colors ${
                      physicsConfig.layoutMode === mode.id 
                        ? 'bg-indigo-600 text-white shadow' 
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Physics Sliders */}
            <div className="space-y-2.5">
              <div>
                <div className="flex justify-between text-[10px] text-zinc-400 mb-0.5">
                  <span>Repulsion Force</span>
                  <span className="font-mono text-zinc-200">{physicsConfig.repelForce}</span>
                </div>
                <input
                  type="range"
                  min="800"
                  max="6000"
                  step="100"
                  value={physicsConfig.repelForce}
                  onChange={(e) => {
                    setPhysicsConfig(prev => ({ ...prev, repelForce: Number(e.target.value) }));
                    reheatSimulation(0.5);
                  }}
                  className="w-full accent-indigo-500 bg-zinc-800 h-1 rounded appearance-none cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-[10px] text-zinc-400 mb-0.5">
                  <span>Link Distance</span>
                  <span className="font-mono text-zinc-200">{physicsConfig.linkDistance}px</span>
                </div>
                <input
                  type="range"
                  min="60"
                  max="280"
                  step="10"
                  value={physicsConfig.linkDistance}
                  onChange={(e) => {
                    setPhysicsConfig(prev => ({ ...prev, linkDistance: Number(e.target.value) }));
                    reheatSimulation(0.5);
                  }}
                  className="w-full accent-indigo-500 bg-zinc-800 h-1 rounded appearance-none cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-[10px] text-zinc-400 mb-0.5">
                  <span>Center Gravity</span>
                  <span className="font-mono text-zinc-200">{physicsConfig.centerGravity.toFixed(4)}</span>
                </div>
                <input
                  type="range"
                  min="0.0005"
                  max="0.015"
                  step="0.0005"
                  value={physicsConfig.centerGravity}
                  onChange={(e) => {
                    setPhysicsConfig(prev => ({ ...prev, centerGravity: Number(e.target.value) }));
                    reheatSimulation(0.5);
                  }}
                  className="w-full accent-indigo-500 bg-zinc-800 h-1 rounded appearance-none cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-[10px] text-zinc-400 mb-0.5">
                  <span>Node Size Scale</span>
                  <span className="font-mono text-zinc-200">{physicsConfig.nodeScale.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="1.8"
                  step="0.1"
                  value={physicsConfig.nodeScale}
                  onChange={(e) => {
                    setPhysicsConfig(prev => ({ ...prev, nodeScale: Number(e.target.value) }));
                    reheatSimulation(0.4);
                  }}
                  className="w-full accent-indigo-500 bg-zinc-800 h-1 rounded appearance-none cursor-pointer"
                />
              </div>
            </div>

            {/* Visual Toggles */}
            <div className="pt-2.5 border-t border-zinc-800 mt-2.5 space-y-1.5 text-[11px]">
              <label className="flex items-center justify-between cursor-pointer text-zinc-300">
                <span>Sequence Arrows</span>
                <input
                  type="checkbox"
                  checked={physicsConfig.showArrows}
                  onChange={(e) => setPhysicsConfig(prev => ({ ...prev, showArrows: e.target.checked }))}
                  className="accent-indigo-500 rounded"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer text-zinc-300">
                <span>Always Show All Labels</span>
                <input
                  type="checkbox"
                  checked={physicsConfig.showLabels}
                  onChange={(e) => setPhysicsConfig(prev => ({ ...prev, showLabels: e.target.checked }))}
                  className="accent-indigo-500 rounded"
                />
              </label>
            </div>
          </div>
        )}

        {/* Selected Node Peek Card */}
        {selectedNode && (
          <div 
            className="absolute bottom-4 right-4 sm:right-6 w-72 sm:w-80 bg-[#18181B]/95 backdrop-blur-md border border-zinc-700/80 rounded-xl shadow-2xl p-3.5 text-xs z-30 animate-in fade-in slide-in-from-bottom-2 duration-150"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span 
                  className="w-2.5 h-2.5 rounded-full shrink-0" 
                  style={{ backgroundColor: selectedNode.color }} 
                />
                <h4 className="font-semibold text-xs sm:text-sm text-zinc-100 line-clamp-1">
                  {selectedNode.label}
                </h4>
              </div>
              <button 
                onClick={() => setSelectedNode(null)}
                className="text-zinc-400 hover:text-white p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </div>

            <div className="flex items-center space-x-2 mb-2.5">
              <span className="uppercase text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                {selectedNode.type}
              </span>
              {selectedNode.wordCount !== undefined && (
                <span className="text-[10px] font-mono text-zinc-400">
                  {selectedNode.wordCount} words
                </span>
              )}
              {selectedNode.subType && (
                <span className="text-[10px] text-amber-400/90 font-medium">
                  {selectedNode.subType}
                </span>
              )}
            </div>

            {selectedNode.synopsis && (
              <p className="text-zinc-300 text-[10px] sm:text-[11px] line-clamp-3 mb-2.5 leading-relaxed bg-zinc-900/60 p-2 rounded border border-zinc-800/80">
                {selectedNode.synopsis}
              </p>
            )}

            {/* Cast badges for chapter */}
            {selectedNode.castNames && selectedNode.castNames.length > 0 && (
              <div className="mb-2.5">
                <span className="text-[9px] text-zinc-500 block mb-1">Present Characters:</span>
                <div className="flex flex-wrap gap-1">
                  {selectedNode.castNames.map(cn => (
                    <span key={cn} className="px-1.5 py-0.5 bg-amber-950/40 border border-amber-800/40 text-amber-300 text-[9px] rounded">
                      {cn}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center space-x-2 pt-2 border-t border-zinc-800">
              {selectedNode.type === 'chapter' || selectedNode.type === 'scene' ? (
                <button
                  onClick={handleOpenSelectedNode}
                  className="flex-1 flex items-center justify-center space-x-1.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium text-xs transition-colors shadow"
                >
                  <BookOpen className="w-3 h-3" />
                  <span>Open in Manuscript</span>
                </button>
              ) : selectedNode.type === 'character' ? (
                <button
                  onClick={handleOpenSelectedNode}
                  className="flex-1 flex items-center justify-center space-x-1.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-medium text-xs transition-colors shadow"
                >
                  <Users className="w-3 h-3" />
                  <span>Open Character Codex</span>
                </button>
              ) : selectedNode.type === 'location' || selectedNode.type === 'faction' || selectedNode.type === 'lore' ? (
                <button
                  onClick={handleOpenSelectedNode}
                  className="flex-1 flex items-center justify-center space-x-1.5 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg font-medium text-xs transition-colors shadow"
                >
                  <MapPin className="w-3 h-3" />
                  <span>Open World Codex</span>
                </button>
              ) : selectedNode.type === 'plotThread' || selectedNode.type === 'storyArc' ? (
                <button
                  onClick={handleOpenSelectedNode}
                  className="flex-1 flex items-center justify-center space-x-1.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium text-xs transition-colors shadow"
                >
                  <GitBranch className="w-3 h-3" />
                  <span>Open Plot Threads</span>
                </button>
              ) : selectedNode.type === 'event' ? (
                <button
                  onClick={handleOpenSelectedNode}
                  className="flex-1 flex items-center justify-center space-x-1.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-medium text-xs transition-colors shadow"
                >
                  <Clock className="w-3 h-3" />
                  <span>Open Story Timeline</span>
                </button>
              ) : null}
            </div>
          </div>
        )}

        {/* Modal: Create Relationship Connection */}
        {newRelationModal.isOpen && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#18181B] border border-zinc-700 rounded-2xl w-full max-w-sm p-5 text-xs text-zinc-200 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <h3 className="font-semibold text-sm text-zinc-100 flex items-center space-x-2">
                  <Link2 className="w-4 h-4 text-purple-400" />
                  <span>Connect Story Elements</span>
                </h3>
                <button 
                  onClick={() => setNewRelationModal({ isOpen: false, source: null, target: null, relation: 'Allies' })}
                  className="text-zinc-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900/90 border border-zinc-800 text-xs">
                  <span className="font-semibold text-zinc-200 truncate">{newRelationModal.source?.label}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-indigo-400 shrink-0 mx-2" />
                  <span className="font-semibold text-zinc-200 truncate">{newRelationModal.target?.label}</span>
                </div>

                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1.5">Relationship / Connection Type:</label>
                  <div className="grid grid-cols-2 gap-1.5 mb-2">
                    {[
                      'Allies', 'Enemies / Rivals', 'Mentors', 'Family', 
                      'Romance', 'Betrayed', 'Investigating', 'Faction'
                    ].map(preset => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setNewRelationModal(prev => ({ ...prev, relation: preset }))}
                        className={`py-1 px-2 rounded text-[11px] font-medium border text-left truncate transition-colors ${
                          newRelationModal.relation === preset
                            ? 'bg-purple-600 border-purple-500 text-white'
                            : 'bg-zinc-800/80 border-zinc-700 text-zinc-300 hover:bg-zinc-800'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>

                  <input
                    type="text"
                    placeholder="Or type custom label..."
                    value={newRelationModal.relation}
                    onChange={(e) => setNewRelationModal(prev => ({ ...prev, relation: e.target.value }))}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-zinc-100 outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-zinc-800">
                <button
                  onClick={() => setNewRelationModal({ isOpen: false, source: null, target: null, relation: 'Allies' })}
                  className="px-3 py-1.5 text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateRelationship}
                  className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium shadow"
                >
                  Create Link
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Legend */}
        <div className="absolute bottom-3 left-4 text-[10px] text-zinc-400 bg-zinc-950/70 backdrop-blur px-2.5 py-1 rounded border border-zinc-800 pointer-events-none select-none flex items-center space-x-2 shadow-lg">
          <span>• Scroll to Zoom</span>
          <span>• Shift+Drag to Connect</span>
          <span>• Double-click to Open</span>
        </div>
      </div>
    </div>
  );
};
