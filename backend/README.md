# Fuse Home Backend - Multi-MCP Server with Google Gen AI Integration

A comprehensive multi-MCP server implementation using FastMCP that demonstrates server composition, Google Gemini AI integration, and advanced MCP capabilities.

## 🌟 Features

- **Multi-Server Composition**: Combines multiple specialized MCP servers into one unified interface
- **Google Gemini Integration**: Full integration with Google's Generative AI SDK
- **Gradio Chat Interface**: Web-based chat UI for easy interaction
- **Modular Architecture**: Separate servers for system operations, task management, and AI capabilities
- **Rich MCP Support**: Tools, resources, prompts, and real-time logging
- **Production Ready**: Proper error handling, logging, and environment configuration

## 🏗️ Architecture

### Component Servers

1. **SystemServer** - System operations and health monitoring
   - Tools: `get_system_info`, `health_check`
   - Resources: `system://config`

2. **TaskServer** - Task management and tracking
   - Tools: `create_task`, `list_tasks`, `update_task_status`
   - Resources: `tasks://all`, `tasks://{task_id}`

3. **AIServer** - AI integration and capabilities
   - Tools: `prepare_gemini_integration`, `get_ai_capabilities`
   - Prompts: `ai_assistant`

4. **FuseHomeBackend** (Main) - Unified composition server
   - Tool: `server_overview`
   - Imports all component servers with prefixes

## 🚀 Quick Start

### 1. Setup Environment

```bash
# Clone/navigate to the project directory
cd /Users/joe_codes/dev/fuse-home/backend

# Install dependencies (already done if you followed setup)
# Dependencies: fastmcp, google-genai, pydantic, httpx, python-dotenv, gradio

# Copy environment template
cp .env.example .env

# Edit .env and add your Gemini API key
# GEMINI_API_KEY=your-actual-api-key-here
```

### 2. Run the Server

```bash
# Option 1: Run directly with Python
python main.py

# Option 2: Use FastMCP CLI
fastmcp run main.py:main_server --transport http --port 8000
```

The server will start at `http://localhost:8000/mcp`

### 3. Use the Chat Interface

```bash
# Option 1: Start everything together (recommended)
python launch_chat.py

# Option 2: Chat interface only (server must be running)
python simple_chat.py

# Option 3: Interactive demo
python chat_demo.py
```

The chat interface opens at `http://localhost:7860`

### 4. Test the Server

```bash
# Run the comprehensive test suite
python client_example.py
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `GEMINI_API_KEY` | Google Gemini API key | Required for AI features |
| `FASTMCP_LOG_LEVEL` | Logging level | `INFO` |
| `FASTMCP_RESOURCE_PREFIX_FORMAT` | Resource prefix format | `path` |
| `DEFAULT_PORT` | Server port | `8000` |
| `DEFAULT_HOST` | Server host | `localhost` |

### Getting a Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com/)
2. Sign in with your Google account
3. Go to "Get API Key" section
4. Create a new API key
5. Add it to your `.env` file

## 🛠️ Usage Examples

### Direct MCP Client

```python
import asyncio
from fastmcp import Client

async def example():
    client = Client("http://localhost:8000/mcp")
    
    async with client:
        # Get system health
        health = await client.call_tool("system_health_check")
        print(health.data)
        
        # Create a task
        result = await client.call_tool("task_create_task", {
            "request": {
                "task_id": "my-task",
                "description": "Example task",
                "priority": "high"
            }
        })
        print(result.data)

asyncio.run(example())
```

### Gemini AI Integration

```python
import asyncio
from fastmcp import Client
from google import genai

async def gemini_example():
    mcp_client = Client("http://localhost:8000/mcp")
    gemini_client = genai.Client()
    
    async with mcp_client:
        response = await gemini_client.aio.models.generate_content(
            model="gemini-2.0-flash",
            contents="Check system health and create a task called 'ai-task'",
            config=genai.types.GenerateContentConfig(
                tools=[mcp_client.session],
            ),
        )
        print(response.text)

asyncio.run(gemini_example())
```

## 💬 Gradio Chat Interface

The project includes a web-based chat interface built with Gradio for easy interaction with the MCP server.

### Features

- **Web UI**: Clean, responsive interface at `http://localhost:7860`
- **Direct MCP Integration**: All 8 server tools accessible via chat
- **Quick Commands**: Buttons for common operations
- **Real-time Responses**: Immediate JSON responses from MCP tools
- **Task Management**: Create and manage tasks through natural language
- **System Monitoring**: Check health and system information

### Usage Examples

**Chat Commands:**
```
health check                    # Check system health
system info                     # Get system information  
overview                       # Get server overview
list tasks                     # Show all tasks
create task Review the docs    # Create a new task
ai capabilities               # Show AI integration info
```

**Quick Start:**
```bash
# Start everything (server + chat)
python launch_chat.py

# Or start chat only (server must be running)
python simple_chat.py

# Interactive demo with instructions
python chat_demo.py
```

### Screenshots

The interface provides:
- 💬 **Chat Area**: Natural language interaction with MCP tools
- 🎯 **Quick Commands**: One-click buttons for common operations  
- 📊 **JSON Responses**: Formatted tool outputs
- 🔄 **Connection Status**: Real-time server connectivity
- 🧹 **Clear Chat**: Reset conversation history

## 📊 Available Endpoints

### Tools

| Tool | Description | Server |
|------|-------------|--------|
| `server_overview` | Get overview of all servers | Main |
| `system_get_system_info` | Get system information | System |
| `system_health_check` | Perform health check | System |
| `task_create_task` | Create a new task | Task |
| `task_list_tasks` | List all tasks | Task |
| `task_update_task_status` | Update task status | Task |
| `ai_prepare_gemini_integration` | Setup Gemini API | AI |
| `ai_get_ai_capabilities` | Get AI capabilities | AI |

### Resources

| Resource | Description |
|----------|-------------|
| `system://config` | System configuration |
| `tasks://all` | All tasks as JSON |
| `tasks://{task_id}` | Specific task by ID |

### Prompts

| Prompt | Description |
|--------|-------------|
| `ai_ai_assistant` | AI assistant prompt template |

## 🧪 Testing

The project includes a comprehensive test suite (`client_example.py`) that demonstrates:

- Direct MCP client interaction
- Gemini SDK integration
- Server composition capabilities
- All tools, resources, and prompts

Run tests with:
```bash
python client_example.py
```

## 🔍 Monitoring & Debugging

### Logs

The server provides detailed logging at various levels:
- System operations
- Task management events
- AI integration status
- Client connections

### Health Endpoints

- MCP Endpoint: `http://localhost:8000/mcp`
- Health Check: Use `system_health_check` tool

## 🚀 Deployment Options

### Local Development
```bash
python main.py
```

### FastMCP Cloud
1. Push code to GitHub
2. Sign in to [FastMCP Cloud](https://fastmcp.cloud)
3. Create project with entrypoint: `main.py:main_server`

### Docker (Optional)
```dockerfile
FROM python:3.12-slim

WORKDIR /app
COPY pyproject.toml .
RUN pip install .

COPY . .
EXPOSE 8000

CMD ["python", "main.py"]
```

## 🤝 Client Integration

### Compatible Clients

- Claude Desktop (with MCP configuration)
- Cursor IDE
- Gemini CLI
- Any MCP-compatible client
- Custom FastMCP clients

### MCP Configuration Example

```json
{
  "servers": {
    "fuse-home-backend": {
      "command": "python",
      "args": ["main.py"],
      "env": {
        "GEMINI_API_KEY": "your-key-here"
      }
    }
  }
}
```

## 📈 Extending the Server

### Adding New Servers

1. Create a new `FastMCP` instance
2. Add tools, resources, and prompts
3. Import it into the main server:

```python
my_server = FastMCP("MyServer")

@my_server.tool
def my_tool():
    return "Hello from my tool!"

# In main server setup
await main_server.import_server(my_server, prefix="my")
```

### Integration Patterns

- **Static Composition** (`import_server`): One-time copy, better performance
- **Dynamic Composition** (`mount`): Live linking, real-time updates
- **Proxy Servers**: For remote MCP servers

## 📚 Documentation Links

- [FastMCP Documentation](https://gofastmcp.com/)
- [Google Gemini SDK](https://ai.google.dev/gemini-api/docs)
- [MCP Protocol Specification](https://modelcontextprotocol.io/)

## 🐛 Troubleshooting

### Common Issues

1. **Gemini API Key Issues**
   - Ensure key is set in `.env`
   - Check key validity at Google AI Studio

2. **Port Already in Use**
   - Change `DEFAULT_PORT` in `.env`
   - Kill existing process: `lsof -ti:8000 | xargs kill`

3. **Import Errors**
   - Verify virtual environment is activated
   - Reinstall dependencies: `pip install -e .`

### Debug Mode

Set `FASTMCP_LOG_LEVEL=DEBUG` for verbose logging.

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Submit a pull request

---

**Built with FastMCP 2.11+ and Google Gemini SDK**