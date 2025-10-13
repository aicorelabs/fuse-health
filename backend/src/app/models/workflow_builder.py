"""Workflow builder models for user-friendly workflow creation."""
from typing import Any, Dict, List, Optional, Literal
from pydantic import BaseModel, Field


# ============= Node Models =============


class NodePosition(BaseModel):
    """Position of a node on the canvas."""
    x: float
    y: float


class TriggerNodeData(BaseModel):
    """Data for a trigger node."""
    label: str
    trigger_type: Literal["manual", "scheduled", "webhook", "event"] = "manual"
    config: Dict[str, Any] = Field(default_factory=dict)


class ActionNodeData(BaseModel):
    """Data for an action node."""
    label: str
    service_type: str  # e.g., "gmail", "slack", "openai"
    connection_id: Optional[str] = None
    config: Dict[str, Any] = Field(default_factory=dict)


class ConditionNodeData(BaseModel):
    """Data for a condition node."""
    label: str
    condition: str  # e.g., "${temperature} > 20"
    config: Dict[str, Any] = Field(default_factory=dict)


class TransformNodeData(BaseModel):
    """Data for a transform node."""
    label: str
    transform_type: Literal["map", "filter", "aggregate"] = "map"
    mapping: Optional[Dict[str, str]] = None
    filter_key: Optional[str] = None
    filter_value: Optional[Any] = None
    config: Dict[str, Any] = Field(default_factory=dict)


class DelayNodeData(BaseModel):
    """Data for a delay node."""
    label: str
    delay_seconds: int = Field(ge=0)
    config: Dict[str, Any] = Field(default_factory=dict)


class LoopNodeData(BaseModel):
    """Data for a loop node."""
    label: str
    loop_type: Literal["foreach", "while", "until"] = "foreach"
    items: Optional[str] = None  # Variable name or expression
    condition: Optional[str] = None
    config: Dict[str, Any] = Field(default_factory=dict)


class AINodeData(BaseModel):
    """Data for an AI/LLM node."""
    label: str
    provider: Literal["openai", "anthropic", "google", "azure"] = "openai"
    model: str = "gpt-4"
    prompt: str
    system_prompt: Optional[str] = "You are a helpful assistant."
    temperature: Optional[float] = Field(default=0.7, ge=0, le=2)
    max_tokens: Optional[int] = Field(default=500, ge=1, le=4000)
    config: Dict[str, Any] = Field(default_factory=dict)


# ============= Workflow Node Builder =============


class WorkflowNode(BaseModel):
    """A node in the workflow."""
    id: str
    type: Literal["trigger", "action",
                  "condition", "transform", "delay", "loop"]
    position: NodePosition
    data: Dict[str, Any]  # We'll validate this based on type


class TriggerNode(BaseModel):
    """A trigger node (user-friendly)."""
    id: str
    position: NodePosition
    label: str
    trigger_type: Literal["manual", "scheduled", "webhook", "event"] = "manual"
    config: Optional[Dict[str, Any]] = None

    def to_workflow_node(self) -> Dict[str, Any]:
        """Convert to workflow node format."""
        return {
            "id": self.id,
            "type": "trigger",
            "position": {"x": self.position.x, "y": self.position.y},
            "data": {
                "label": self.label,
                "triggerType": self.trigger_type,
                "config": self.config or {},
            },
        }


class ActionNode(BaseModel):
    """An action node (user-friendly)."""
    id: str
    position: NodePosition
    label: str
    service_type: str
    connection_id: Optional[str] = None
    config: Optional[Dict[str, Any]] = None

    def to_workflow_node(self) -> Dict[str, Any]:
        """Convert to workflow node format."""
        return {
            "id": self.id,
            "type": "action",
            "position": {"x": self.position.x, "y": self.position.y},
            "data": {
                "label": self.label,
                "serviceType": self.service_type,
                "connectionId": self.connection_id,
                "config": self.config or {},
            },
        }


class ConditionNode(BaseModel):
    """A condition node (user-friendly)."""
    id: str
    position: NodePosition
    label: str
    condition: str
    config: Optional[Dict[str, Any]] = None

    def to_workflow_node(self) -> Dict[str, Any]:
        """Convert to workflow node format."""
        return {
            "id": self.id,
            "type": "condition",
            "position": {"x": self.position.x, "y": self.position.y},
            "data": {
                "label": self.label,
                "condition": self.condition,
                "config": self.config or {},
            },
        }


class TransformNode(BaseModel):
    """A transform node (user-friendly)."""
    id: str
    position: NodePosition
    label: str
    transform_type: Literal["map", "filter", "aggregate"] = "map"
    mapping: Optional[Dict[str, str]] = None
    filter_key: Optional[str] = None
    filter_value: Optional[Any] = None
    config: Optional[Dict[str, Any]] = None

    def to_workflow_node(self) -> Dict[str, Any]:
        """Convert to workflow node format."""
        config = self.config or {}
        config.update({
            "type": self.transform_type,
            "mapping": self.mapping,
            "filterKey": self.filter_key,
            "filterValue": self.filter_value,
        })

        return {
            "id": self.id,
            "type": "transform",
            "position": {"x": self.position.x, "y": self.position.y},
            "data": {
                "label": self.label,
                "config": config,
            },
        }


class DelayNode(BaseModel):
    """A delay node (user-friendly)."""
    id: str
    position: NodePosition
    label: str
    delay_seconds: int = Field(ge=0)
    config: Optional[Dict[str, Any]] = None

    def to_workflow_node(self) -> Dict[str, Any]:
        """Convert to workflow node format."""
        config = self.config or {}
        config["delay"] = self.delay_seconds

        return {
            "id": self.id,
            "type": "delay",
            "position": {"x": self.position.x, "y": self.position.y},
            "data": {
                "label": self.label,
                "config": config,
            },
        }


class LoopNode(BaseModel):
    """A loop node (user-friendly)."""
    id: str
    position: NodePosition
    label: str
    loop_type: Literal["foreach", "while"] = "foreach"
    items: Optional[str] = None  # Variable name containing items to loop over
    condition: Optional[str] = None  # For while loops
    config: Optional[Dict[str, Any]] = None

    def to_workflow_node(self) -> Dict[str, Any]:
        """Convert to workflow node format."""
        config = self.config or {}
        config["loop_type"] = self.loop_type
        if self.items:
            config["items"] = self.items
        if self.condition:
            config["condition"] = self.condition

        return {
            "id": self.id,
            "type": "loop",
            "position": {"x": self.position.x, "y": self.position.y},
            "data": {
                "label": self.label,
                "config": config,
            },
        }


class AINode(BaseModel):
    """An AI/LLM node (user-friendly)."""
    id: str
    position: NodePosition
    label: str
    provider: Literal["openai", "anthropic", "google", "azure"] = "openai"
    model: str = "gpt-4"
    prompt: str
    system_prompt: Optional[str] = "You are a helpful assistant."
    temperature: Optional[float] = Field(default=0.7, ge=0, le=2)
    max_tokens: Optional[int] = Field(default=500, ge=1, le=4000)
    config: Optional[Dict[str, Any]] = None

    def to_workflow_node(self) -> Dict[str, Any]:
        """Convert to workflow node format."""
        config = self.config or {}
        config.update({
            "provider": self.provider,
            "model": self.model,
            "prompt": self.prompt,
            "system_prompt": self.system_prompt,
            "temperature": self.temperature,
            "max_tokens": self.max_tokens,
        })

        return {
            "id": self.id,
            "type": "ai",
            "position": {"x": self.position.x, "y": self.position.y},
            "data": {
                "label": self.label,
                "config": config,
            },
        }


# ============= Workflow Edge =============


class WorkflowEdge(BaseModel):
    """An edge connecting two nodes."""
    id: str
    source: str  # Source node ID
    target: str  # Target node ID
    condition: Optional[str] = None  # Optional condition for conditional edges

    def to_workflow_edge(self) -> Dict[str, Any]:
        """Convert to workflow edge format."""
        edge = {
            "id": self.id,
            "source": self.source,
            "target": self.target,
        }
        if self.condition:
            edge["condition"] = self.condition
        return edge


# ============= Workflow Builder Request =============


class CreateWorkflowBuilderRequest(BaseModel):
    """User-friendly workflow creation request."""
    user_id: str
    name: str
    description: Optional[str] = None
    category: Optional[str] = None

    # Use typed nodes
    trigger_nodes: Optional[List[TriggerNode]] = Field(default_factory=list)
    action_nodes: Optional[List[ActionNode]] = Field(default_factory=list)
    condition_nodes: Optional[List[ConditionNode]] = Field(default_factory=list)
    transform_nodes: Optional[List[TransformNode]] = Field(default_factory=list)
    delay_nodes: Optional[List[DelayNode]] = Field(default_factory=list)
    loop_nodes: Optional[List[LoopNode]] = Field(default_factory=list)
    ai_nodes: Optional[List[AINode]] = Field(default_factory=list)

    edges: List[WorkflowEdge]
    metadata: Optional[Dict[str, Any]] = None

    def to_create_workflow_request(self) -> Dict[str, Any]:
        """Convert to the raw workflow format."""
        nodes = []

        # Collect all nodes
        for trigger in self.trigger_nodes or []:
            nodes.append(trigger.to_workflow_node())

        for action in self.action_nodes or []:
            nodes.append(action.to_workflow_node())

        for condition in self.condition_nodes or []:
            nodes.append(condition.to_workflow_node())

        for transform in self.transform_nodes or []:
            nodes.append(transform.to_workflow_node())

        for delay in self.delay_nodes or []:
            nodes.append(delay.to_workflow_node())
        
        for loop in self.loop_nodes or []:
            nodes.append(loop.to_workflow_node())
        
        for ai in self.ai_nodes or []:
            nodes.append(ai.to_workflow_node())

        # Convert edges
        edges = [edge.to_workflow_edge() for edge in self.edges]

        return {
            "user_id": self.user_id,
            "name": self.name,
            "description": self.description,
            "category": self.category,
            "nodes": nodes,
            "edges": edges,
            "metadata": self.metadata or {},
        }


# ============= Quick Builder Helpers =============


def create_email_workflow(
    user_id: str,
    name: str,
    recipient: str,
    subject: str,
    body: str,
    connection_id: Optional[str] = None,
) -> CreateWorkflowBuilderRequest:
    """Helper to quickly create an email workflow."""
    return CreateWorkflowBuilderRequest(
        user_id=user_id,
        name=name,
        description=f"Send email to {recipient}",
        category="Communication",
        trigger_nodes=[
            TriggerNode(
                id="trigger-1",
                position=NodePosition(x=100, y=100),
                label="Manual Trigger",
                trigger_type="manual",
            )
        ],
        action_nodes=[
            ActionNode(
                id="action-1",
                position=NodePosition(x=300, y=100),
                label="Send Email",
                service_type="gmail",
                connection_id=connection_id,
                config={
                    "to": recipient,
                    "subject": subject,
                    "body": body,
                },
            )
        ],
        edges=[
            WorkflowEdge(
                id="e1",
                source="trigger-1",
                target="action-1",
            )
        ],
    )
