"""
PubMed Connector - Search medical literature and research articles.

This connector provides access to PubMed database for searching medical
literature and retrieving article details. No API key required.
"""
from typing import Any, Dict, List
import httpx

from ..base import (
    BaseConnector,
    ConnectorMetadata,
    ConnectorAction,
    ActionParameter,
    ConnectorResult,
    AuthType,
    ConnectorCategory,
)


class PubMedConnector(BaseConnector):
    """PubMed connector for medical literature search."""

    ESEARCH_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
    EFETCH_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi"
    ESUMMARY_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi"

    def get_metadata(self) -> ConnectorMetadata:
        """Return PubMed connector metadata."""
        return ConnectorMetadata(
            id="pubmed",
            name="PubMed",
            description="Search medical literature and research articles from PubMed database",
            category=ConnectorCategory.HEALTHCARE,
            auth_type=AuthType.NONE,
            icon="📚",
        )

    def get_actions(self) -> List[ConnectorAction]:
        """Return available PubMed actions."""
        return [
            ConnectorAction(
                id="search_articles",
                name="Search Articles",
                description="Search for articles in PubMed",
                category="query",
                params=[
                    ActionParameter(
                        name="query",
                        type="string",
                        description="Search query (e.g., 'diabetes treatment', 'COVID-19[title]')",
                        required=True,
                    ),
                    ActionParameter(
                        name="max_results",
                        type="integer",
                        description="Maximum number of results (default: 20, max: 100)",
                        required=False,
                    ),
                    ActionParameter(
                        name="sort",
                        type="string",
                        description="Sort order: 'relevance', 'pub_date', 'author', 'journal' (default: relevance)",
                        required=False,
                    ),
                ],
            ),
            ConnectorAction(
                id="get_article_details",
                name="Get Article Details",
                description="Get detailed information about a specific article",
                category="query",
                params=[
                    ActionParameter(
                        name="pmid",
                        type="string",
                        description="PubMed ID (PMID) of the article",
                        required=True,
                    ),
                ],
            ),
            ConnectorAction(
                id="search_by_author",
                name="Search by Author",
                description="Search articles by author name",
                category="query",
                params=[
                    ActionParameter(
                        name="author_name",
                        type="string",
                        description="Author name to search for",
                        required=True,
                    ),
                    ActionParameter(
                        name="max_results",
                        type="integer",
                        description="Maximum number of results (default: 20)",
                        required=False,
                    ),
                ],
            ),
            ConnectorAction(
                id="search_recent_articles",
                name="Search Recent Articles",
                description="Search for recently published articles on a topic",
                category="query",
                params=[
                    ActionParameter(
                        name="topic",
                        type="string",
                        description="Research topic",
                        required=True,
                    ),
                    ActionParameter(
                        name="days",
                        type="integer",
                        description="Number of days back to search (default: 30)",
                        required=False,
                    ),
                    ActionParameter(
                        name="max_results",
                        type="integer",
                        description="Maximum number of results (default: 20)",
                        required=False,
                    ),
                ],
            ),
        ]

    async def execute(
        self, action_id: str, parameters: Dict[str, Any], credentials: Dict[str, Any]
    ) -> ConnectorResult:
        """Execute a PubMed action."""
        if action_id == "search_articles":
            return await self._search_articles(parameters)
        elif action_id == "get_article_details":
            return await self._get_article_details(parameters)
        elif action_id == "search_by_author":
            return await self._search_by_author(parameters)
        elif action_id == "search_recent_articles":
            return await self._search_recent_articles(parameters)
        else:
            return ConnectorResult(
                success=False,
                error=f"Unknown action: {action_id}",
            )

    async def _search_articles(self, parameters: Dict[str, Any]) -> ConnectorResult:
        """Search for articles in PubMed."""
        query = parameters.get("query")
        if not query:
            return ConnectorResult(
                success=False,
                error="Missing required parameter: query",
            )

        max_results = min(int(parameters.get("max_results", 20)), 100)
        sort_option = parameters.get("sort", "relevance")

        try:
            # Map sort options
            sort_mapping = {
                "relevance": "",
                "pub_date": "pub+date",
                "author": "author",
                "journal": "journal",
            }
            sort_param = sort_mapping.get(sort_option, "")

            # Search for article IDs
            search_params = {
                "db": "pubmed",
                "term": query,
                "retmax": max_results,
                "retmode": "json",
                "tool": "FuseHealthConnector",
                "email": "research@fuse.health",
            }
            
            if sort_param:
                search_params["sort"] = sort_param

            async with httpx.AsyncClient() as client:
                response = await client.get(
                    self.ESEARCH_URL,
                    params=search_params,
                    timeout=30.0,
                )
                response.raise_for_status()
                search_result = response.json()

            id_list = search_result.get("esearchresult", {}).get("idlist", [])
            count = int(search_result.get("esearchresult", {}).get("count", 0))

            if not id_list:
                return ConnectorResult(
                    success=True,
                    data={"articles": [], "count": 0, "total_count": count},
                    message=f"No articles found for '{query}'",
                )

            # Get summaries for the articles
            async with httpx.AsyncClient() as client:
                summary_response = await client.get(
                    self.ESUMMARY_URL,
                    params={
                        "db": "pubmed",
                        "id": ",".join(id_list),
                        "retmode": "json",
                        "tool": "FuseHealthConnector",
                        "email": "research@fuse.health",
                    },
                    timeout=30.0,
                )
                summary_response.raise_for_status()
                summary_result = summary_response.json()

            articles = []
            for pmid in id_list:
                article_data = summary_result.get("result", {}).get(pmid, {})
                if article_data:
                    articles.append({
                        "pmid": pmid,
                        "title": article_data.get("title"),
                        "authors": [
                            a.get("name") for a in article_data.get("authors", [])[:3]
                        ],
                        "source": article_data.get("source"),
                        "pub_date": article_data.get("pubdate"),
                        "doi": article_data.get("elocationid", ""),
                    })

            return ConnectorResult(
                success=True,
                data={
                    "articles": articles,
                    "count": len(articles),
                    "total_count": count,
                },
                message=f"Found {count} article(s) matching '{query}'",
            )

        except httpx.HTTPStatusError as e:
            return ConnectorResult(
                success=False,
                error=f"PubMed API error: {e.response.status_code}",
            )
        except Exception as e:
            return ConnectorResult(
                success=False,
                error=f"Failed to search articles: {str(e)}",
            )

    async def _get_article_details(self, parameters: Dict[str, Any]) -> ConnectorResult:
        """Get detailed information about an article."""
        pmid = parameters.get("pmid")
        if not pmid:
            return ConnectorResult(
                success=False,
                error="Missing required parameter: pmid",
            )

        try:
            # Get article abstract in text format
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    self.EFETCH_URL,
                    params={
                        "db": "pubmed",
                        "id": pmid,
                        "retmode": "text",
                        "rettype": "abstract",
                        "tool": "FuseHealthConnector",
                        "email": "research@fuse.health",
                    },
                    timeout=30.0,
                )
                response.raise_for_status()
                abstract_text = response.text

            # Also get structured summary
            async with httpx.AsyncClient() as client:
                summary_response = await client.get(
                    self.ESUMMARY_URL,
                    params={
                        "db": "pubmed",
                        "id": pmid,
                        "retmode": "json",
                        "tool": "FuseHealthConnector",
                        "email": "research@fuse.health",
                    },
                    timeout=30.0,
                )
                summary_response.raise_for_status()
                summary_result = summary_response.json()

            article_data = summary_result.get("result", {}).get(pmid, {})
            
            if not article_data:
                return ConnectorResult(
                    success=False,
                    error=f"Article not found: {pmid}",
                )

            details = {
                "pmid": pmid,
                "title": article_data.get("title"),
                "authors": [a.get("name") for a in article_data.get("authors", [])],
                "source": article_data.get("source"),
                "pub_date": article_data.get("pubdate"),
                "volume": article_data.get("volume"),
                "issue": article_data.get("issue"),
                "pages": article_data.get("pages"),
                "doi": article_data.get("elocationid", ""),
                "abstract": abstract_text,
            }

            return ConnectorResult(
                success=True,
                data=details,
                message=f"Retrieved details for PMID {pmid}",
            )

        except httpx.HTTPStatusError as e:
            return ConnectorResult(
                success=False,
                error=f"PubMed API error: {e.response.status_code}",
            )
        except Exception as e:
            return ConnectorResult(
                success=False,
                error=f"Failed to get article details: {str(e)}",
            )

    async def _search_by_author(self, parameters: Dict[str, Any]) -> ConnectorResult:
        """Search articles by author."""
        author_name = parameters.get("author_name")
        if not author_name:
            return ConnectorResult(
                success=False,
                error="Missing required parameter: author_name",
            )

        # Format search query with author field
        search_params = {
            "query": f"{author_name}[author]",
            "max_results": parameters.get("max_results", 20),
            "sort": "pub_date",
        }

        return await self._search_articles(search_params)

    async def _search_recent_articles(self, parameters: Dict[str, Any]) -> ConnectorResult:
        """Search for recent articles."""
        topic = parameters.get("topic")
        if not topic:
            return ConnectorResult(
                success=False,
                error="Missing required parameter: topic",
            )

        days = int(parameters.get("days", 30))
        max_results = min(int(parameters.get("max_results", 20)), 100)

        try:
            # Search with date filter
            search_params = {
                "db": "pubmed",
                "term": topic,
                "reldate": days,
                "datetype": "pdat",
                "retmax": max_results,
                "retmode": "json",
                "sort": "pub+date",
                "tool": "FuseHealthConnector",
                "email": "research@fuse.health",
            }

            async with httpx.AsyncClient() as client:
                response = await client.get(
                    self.ESEARCH_URL,
                    params=search_params,
                    timeout=30.0,
                )
                response.raise_for_status()
                search_result = response.json()

            id_list = search_result.get("esearchresult", {}).get("idlist", [])
            count = int(search_result.get("esearchresult", {}).get("count", 0))

            if not id_list:
                return ConnectorResult(
                    success=True,
                    data={"articles": [], "count": 0},
                    message=f"No recent articles found for '{topic}'",
                )

            # Get summaries
            async with httpx.AsyncClient() as client:
                summary_response = await client.get(
                    self.ESUMMARY_URL,
                    params={
                        "db": "pubmed",
                        "id": ",".join(id_list),
                        "retmode": "json",
                        "tool": "FuseHealthConnector",
                        "email": "research@fuse.health",
                    },
                    timeout=30.0,
                )
                summary_response.raise_for_status()
                summary_result = summary_response.json()

            articles = []
            for pmid in id_list:
                article_data = summary_result.get("result", {}).get(pmid, {})
                if article_data:
                    articles.append({
                        "pmid": pmid,
                        "title": article_data.get("title"),
                        "pub_date": article_data.get("pubdate"),
                        "source": article_data.get("source"),
                    })

            return ConnectorResult(
                success=True,
                data={"articles": articles, "count": len(articles), "total_count": count},
                message=f"Found {count} article(s) from the last {days} days",
            )

        except httpx.HTTPStatusError as e:
            return ConnectorResult(
                success=False,
                error=f"PubMed API error: {e.response.status_code}",
            )
        except Exception as e:
            return ConnectorResult(
                success=False,
                error=f"Failed to search recent articles: {str(e)}",
            )
