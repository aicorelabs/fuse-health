"""
PubMed MCP Server - Research medical articles on PubMed database
"""
from dotenv import load_dotenv

load_dotenv()

import asyncio
import aiohttp
from typing import Dict, Any, Optional, Literal
from urllib.parse import urlencode, quote_plus

from fastmcp import FastMCP
from pydantic import BaseModel, Field

# PubMed MCP Server
pubmed_server = FastMCP("PubMedMCP")


class SearchAbstractsRequest(BaseModel):
    """
    Request parameters for NCBI ESearch API for searching abstracts on the PubMed database.

    Functions:
        - Provides a list of abstracts matching a text query

    Examples:
        >>> # Basic search in PubMed for 'asthma' articles abstracts
        >>> SearchAbstractsRequest(term="asthma")

        >>> # Search with publication date range
        >>> SearchAbstractsRequest(
        ...     term="asthma",
        ...     mindate="2020/01/01",
        ...     maxdate="2020/12/31",
        ...     datetype="pdat"
        ... )

        >>> # Search with field restriction
        >>> SearchAbstractsRequest(term="asthma[title]")
        >>> # Or equivalently:
        >>> SearchAbstractsRequest(term="asthma", field="title")

        >>> # Sort results by publication date
        >>> SearchAbstractsRequest(
        ...     term="asthma",
        ...     sort="pub_date"
        ... )
    """

    term: str = Field(
        ...,
        description="""Enter text query. All special characters must be URL encoded. 
        Spaces may be replaced by '+' signs. For very long queries (more than several 
        hundred characters), consider using an HTTP POST call. See PubMed or Entrez 
        help for information about search field descriptions and tags. Search fields 
        and tags are database specific.""",
    )

    retmax: Optional[int] = Field(
        20,
        description="""Number of UIDs to return (default=20, max=10000).""",
    )

    sort: Optional[str] = Field(
        None,
        description="""Sort method for results. PubMed values:
        - pub_date: descending sort by publication date
        - Author: ascending sort by first author
        - JournalName: ascending sort by journal name
        - relevance: default sort order ("Best Match")""",
    )
    field: Optional[str] = Field(
        None,
        description="""Search field to limit entire search. Equivalent to adding [field] 
        to term.""",
    )
    datetype: Optional[Literal["mdat", "pdat", "edat"]] = Field(
        None,
        description="""Type of date used to limit search:
        - mdat: modification date
        - pdat: publication date
        - edat: Entrez date
        Generally databases have only two allowed values.""",
    )
    reldate: Optional[int] = Field(
        None,
        description="""When set to n, returns items with datetype within the last n 
        days.""",
    )
    mindate: Optional[str] = Field(
        None,
        description="""Start date for date range. Format: YYYY/MM/DD, YYYY/MM, or YYYY. 
        Must be used with maxdate.""",
    )
    maxdate: Optional[str] = Field(
        None,
        description="""End date for date range. Format: YYYY/MM/DD, YYYY/MM, or YYYY. 
        Must be used with mindate.""",
    )


async def _search_pubmed_abstracts(request: SearchAbstractsRequest) -> str:
    """Helper function to search abstracts on PubMed database based on the request parameters.

    Returns a formatted text containing:
    - Title of the article
    - Abstract content
    - Authors
    - Journal name
    - Publication date
    - DOI
    - PMID

    Args:
        request: SearchAbstractsRequest with search parameters
    """
    try:
        # Build search parameters
        search_params = {
            "db": "pubmed",
            "term": request.term,
            "retmax": request.retmax or 20,
            "retmode": "json",
            "tool": "PubMedMCP",
            "email": "research@example.com"
        }

        # Add optional parameters
        if request.sort:
            search_params["sort"] = request.sort
        if request.field:
            search_params["field"] = request.field
        if request.datetype:
            search_params["datetype"] = request.datetype
        if request.reldate:
            search_params["reldate"] = request.reldate
        if request.mindate:
            search_params["mindate"] = request.mindate
        if request.maxdate:
            search_params["maxdate"] = request.maxdate

        # Perform ESearch to get article IDs
        esearch_url = f"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"

        async with aiohttp.ClientSession() as session:
            async with session.get(esearch_url, params=search_params) as response:
                if response.status != 200:
                    return f"Error: ESearch request failed with status {response.status}"

                search_data = await response.json()

                if "esearchresult" not in search_data:
                    return "Error: Invalid response from PubMed ESearch"

                search_result = search_data["esearchresult"]
                id_list = search_result.get("idlist", [])

                if not id_list:
                    return f"No articles found for the search query: {request.term}"

                # Perform EFetch to get article details
                efetch_params = {
                    "db": "pubmed",
                    "id": ",".join(id_list),
                    "retmode": "text",
                    "rettype": "abstract",
                    "tool": "PubMedMCP",
                    "email": "research@example.com"
                }

                efetch_url = f"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi"

                async with session.get(efetch_url, params=efetch_params) as fetch_response:
                    if fetch_response.status != 200:
                        return f"Error: EFetch request failed with status {fetch_response.status}"

                    abstracts_text = await fetch_response.text()

                    return f"Search Results for '{request.term}' ({len(id_list)} articles found):\n\n{abstracts_text}"

    except Exception as e:
        return f"Error searching PubMed: {str(e)}"

@pubmed_server.tool()
async def search_abstracts(request: SearchAbstractsRequest) -> str:
    """Search abstracts on PubMed database based on the request parameters."""
    return await _search_pubmed_abstracts(request)


@pubmed_server.tool()
async def get_article_details(pmid: str) -> str:
    """Get detailed information for a specific PubMed article by PMID.

    Args:
        pmid: PubMed ID of the article to retrieve

    Returns:
        Detailed article information including abstract, authors, journal, etc.
    """

    try:
        efetch_params = {
            "db": "pubmed",
            "id": pmid,
            "retmode": "text",
            "rettype": "abstract",
            "tool": "PubMedMCP",
            "email": "research@example.com"
        }

        efetch_url = f"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi"

        async with aiohttp.ClientSession() as session:
            async with session.get(efetch_url, params=efetch_params) as response:
                if response.status != 200:
                    return f"Error: EFetch request failed with status {response.status}"

                article_data = await response.text()

                return f"Article Details for PMID {pmid}:\n\n{article_data}"

    except Exception as e:
        return f"Error retrieving article {pmid}: {str(e)}"


@pubmed_server.tool()
async def search_by_author(author_name: str, retmax: int = 20) -> str:
    """Search for articles by a specific author.

    Args:
        author_name: Name of the author to search for
        retmax: Maximum number of results to return (default: 20)

    Returns:
        List of articles by the specified author
    """

    # Format author search term
    search_term = f"{author_name}[author]"

    request = SearchAbstractsRequest(
        term=search_term,
        retmax=retmax,
        sort="pub_date"
    )

    return await _search_pubmed_abstracts(request)


@pubmed_server.tool()
async def search_recent_articles(topic: str, days: int = 30, retmax: int = 20) -> str:
    """Search for recent articles on a specific topic.

    Args:
        topic: Research topic to search for
        days: Number of days back to search (default: 30)
        retmax: Maximum number of results to return (default: 20)

    Returns:
        Recent articles on the specified topic
    """

    request = SearchAbstractsRequest(
        term=topic,
        reldate=days,
        datetype="pdat",
        retmax=retmax,
        sort="pub_date"
    )

    return await _search_pubmed_abstracts(request)


@pubmed_server.prompt()
def pubmed_research_prompt(topic: str = "medical research") -> str:
    """Generate a prompt for PubMed research assistance."""
    return f"""You are a medical research assistant with access to PubMed database search capabilities.

Research Topic: {topic}

Available PubMed Tools:
- search_abstracts: Search for articles by topic with advanced filtering options
- get_article_details: Get detailed information for specific articles by PMID
- search_by_author: Find articles by specific authors
- search_recent_articles: Find recent publications on a topic

Research Guidelines:
1. Use specific medical terminology and MeSH terms when possible
2. Consider date ranges for current vs. historical research
3. Filter by publication types (reviews, clinical trials, meta-analyses)
4. Cross-reference findings from multiple sources
5. Pay attention to journal impact and study methodology

Please provide evidence-based information using PubMed search results to support your responses.
Always cite PMIDs and include publication details for referenced articles.
"""


@pubmed_server.tool()
async def get_pubmed_capabilities() -> Dict[str, Any]:
    """Get information about PubMed MCP server capabilities."""
    return {
        "server_name": "PubMedMCP",
        "description": "Medical literature search and research server",
        "capabilities": [
            "Abstract search with advanced filtering",
            "Author-based article search",
            "Recent publications search",
            "Detailed article retrieval",
            "Date range filtering",
            "Field-specific searches"
        ],
        "supported_databases": ["PubMed"],
        "search_fields": [
            "title", "abstract", "author", "journal",
            "mesh", "keyword", "doi", "pmid"
        ],
        "date_types": ["publication_date", "modification_date", "entrez_date"],
        "sort_options": ["relevance", "pub_date", "author", "journal_name"],
        "max_results": 100,
        "example_searches": [
            "diabetes treatment",
            "COVID-19[title] AND vaccine",
            "cancer immunotherapy[mesh]",
            "Smith JA[author]"
        ]
    }


if __name__ == "__main__":
    pubmed_server.run()
