import React, { useState } from 'react';
import { ethers } from 'ethers';
import axios from 'axios';

interface PaperSearchProps {
  contract: ethers.Contract;
  setError: (error: string) => void;
}

interface SearchResult {
  paperId: number;
  title: string;
  abstract: string;
  similarity: number;
}

const PaperSearch: React.FC<PaperSearchProps> = ({ contract, setError }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setSearching(true);
    setError('');

    try {
      // This would typically call your backend search service
      // For now, we'll do a simple text search on the frontend
      const searchResults: SearchResult[] = [];

      // Try to load papers one by one until we get an error
      // This is a workaround since we don't have getTotalPapers()
      let paperId = 1;
      const maxAttempts = 100; // Prevent infinite loop
      
      for (let i = 0; i < maxAttempts; i++) {
        try {
          const paper = await contract.getPaper(paperId);
          
          // Simple text search (in production, this would use embeddings)
          const searchText = `${paper.title} ${paper.paperAbstract} ${paper.keywords.join(' ')}`.toLowerCase();
          const queryLower = query.toLowerCase();
          
          if (searchText.includes(queryLower)) {
            // Calculate a simple similarity score
            const titleMatch = paper.title.toLowerCase().includes(queryLower) ? 0.8 : 0;
            const abstractMatch = paper.paperAbstract.toLowerCase().includes(queryLower) ? 0.6 : 0;
            const keywordMatch = paper.keywords.some((k: string) => k.toLowerCase().includes(queryLower)) ? 0.4 : 0;
            
            const similarity = Math.min(1, titleMatch + abstractMatch + keywordMatch);
            
            if (similarity > 0) {
              searchResults.push({
                paperId: paperId,
                title: paper.title,
                abstract: paper.paperAbstract,
                similarity
              });
            }
          }
          paperId++;
        } catch (error) {
          // If we get an error, we've reached the end of papers
          break;
        }
      }

      // Sort by similarity
      searchResults.sort((a, b) => b.similarity - a.similarity);
      setResults(searchResults);

    } catch (error: any) {
      setError('Search failed: ' + error.message);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="paper-search">
      <h2>Search Papers</h2>
      <form onSubmit={handleSearch}>
        <div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search papers by title, abstract, or keywords..."
            required
          />
          <button type="submit" disabled={searching}>
            {searching ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>

      {results.length > 0 && (
        <div className="search-results">
          <h3>Search Results ({results.length})</h3>
          {results.map((result) => (
            <div key={result.paperId} className="search-result">
              <h4>{result.title}</h4>
              <p><strong>Similarity:</strong> {(result.similarity * 100).toFixed(1)}%</p>
              <p><strong>Abstract:</strong> {result.abstract.substring(0, 200)}...</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PaperSearch; 