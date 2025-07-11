import bodyParser from "body-parser";
import express from "express";
import pg from "pg";

// Connect to the database using the DATABASE_URL environment
//   variable injected by Railway
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

const app = express();
const port = process.env.PORT || 3333;

app.use(bodyParser.json());
app.use(bodyParser.raw({ type: "application/vnd.custom-type" }));
app.use(bodyParser.text({ type: "text/html" }));

app.get("/", async (req, res) => {
  const { rows } = await pool.query("SELECT NOW()");
  res.send(`Hello, World! The time from the DB is ${rows[0].now}`);
});

// MCP Tool List Endpoint
app.get("/mcp/tools", (req, res) => {
  res.json({
    tools: [
      {
        name: "query_database",
        description: "Execute SQL queries on PostgreSQL",
        parameters: {
          query: {
            type: "string",
            description: "SQL query to execute",
            required: true
          }
        }
      },
      {
        name: "graph_api_request",
        description: "Make requests to Microsoft Graph API",
        parameters: {
          endpoint: {
            type: "string",
            description: "Graph API endpoint path",
            required: true
          },
          method: {
            type: "string",
            description: "HTTP method (GET, POST, etc.)",
            required: false
          }
        }
      }
    ]
  });
});

// MCP Tool Execution Endpoint
app.post("/mcp/tools/:toolName", async (req, res) => {
  const { toolName } = req.params;
  const args = req.body.arguments || req.body;

  try {
    switch (toolName) {
      case "query_database":
        const { rows } = await pool.query(args.query);
        res.json({
          success: true,
          result: rows
        });
        break;
        
      case "graph_api_request":
        // Placeholder for Graph API logic
        res.json({
          success: true,
          message: "Graph API endpoint placeholder",
          endpoint: args.endpoint,
          method: args.method || "GET"
        });
        break;
        
      default:
        res.status(404).json({
          error: "Tool not found",
          availableTools: ["query_database", "graph_api_request"]
        });
    }
  } catch (error) {
    console.error(`Error executing ${toolName}:`, error);
    res.status(500).json({
      error: error.message,
      tool: toolName
    });
  }
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
