import React, { useState } from 'react';
import { Search, Calendar, MapPin, Tag, PackageX, SlidersHorizontal, Zap } from 'lucide-react';
import { Asset, User } from '../types.js';

interface AssetCatalogProps {
  assets: Asset[];
  currentUser: User;
  onSelectReserve: (asset: Asset) => void;
}

export const AssetCatalog: React.FC<AssetCatalogProps> = ({ assets, currentUser, onSelectReserve }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);

  const categories = ['ALL', ...Array.from(new Set(assets.map(a => a.category)))];

  const filtered = assets.filter(a => {
    const q = searchTerm.toLowerCase();
    const matchSearch = !q ||
      a.name.toLowerCase().includes(q) ||
      a.serial_number.toLowerCase().includes(q) ||
      (a.description || '').toLowerCase().includes(q) ||
      a.category.toLowerCase().includes(q);
    const matchCat = selectedCategory === 'ALL' || a.category === selectedCategory;
    const matchAvail = !showAvailableOnly || a.status === 'AVAILABLE';
    return matchSearch && matchCat && matchAvail;
  });

  const availableCount = assets.filter(a => a.status === 'AVAILABLE').length;

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Equipment Catalog</h1>
          <p className="page-subtitle">
            {availableCount} of {assets.length} assets available for reservation
          </p>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
          <button
            className={`btn btn-sm ${showAvailableOnly ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setShowAvailableOnly(!showAvailableOnly)}
          >
            <SlidersHorizontal size={14} />
            {showAvailableOnly ? 'Available Only' : 'All Status'}
          </button>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="search-bar">
        <div className="search-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search by name, serial number, or description..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            id="asset-search-input"
          />
        </div>

        <div className="filter-chips">
          {categories.map(cat => (
            <button
              key={cat}
              className={`chip ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Asset Grid */}
      {filtered.length === 0 ? (
        <div className="glass-panel">
          <div className="empty-state">
            <PackageX size={40} color="var(--text-4)" />
            <h3>No equipment found</h3>
            <p>Try adjusting your search query or clearing the category filter.</p>
          </div>
        </div>
      ) : (
        <div className="grid-assets">
          {filtered.map(asset => (
            <div key={asset.id} className="glass-card" style={{ display:'flex', flexDirection:'column' }}>
              <div className="asset-card-top">
                <span className="cat-tag">
                  <Tag size={11} />
                  {asset.category}
                </span>
                <span className={`status-badge status-${asset.status}`}>{asset.status}</span>
              </div>

              <h3 className="asset-name">{asset.name}</h3>
              <p className="asset-desc">{asset.description || 'No description provided.'}</p>

              <div className="asset-meta">
                <div className="asset-meta-row">
                  <span>Serial</span>
                  <span className="asset-serial">{asset.serial_number}</span>
                </div>
                <div className="asset-meta-row">
                  <span><MapPin size={12} style={{ verticalAlign:'middle', marginRight:2 }} />Location</span>
                  <span style={{ color:'var(--text-2)', fontSize:'0.8rem' }}>{asset.location}</span>
                </div>
                <div className="asset-meta-row">
                  <span>Late Penalty</span>
                  <span className="asset-penalty">${asset.daily_penalty_rate.toFixed(2)}/day</span>
                </div>
              </div>

              {/* Availability bar visual */}
              <div className="availability-bar">
                <div
                  className={`availability-fill-${asset.status === 'AVAILABLE' ? 'good' : 'busy'}`}
                  style={{ height:'100%', width: asset.status === 'AVAILABLE' ? '100%' : '30%', borderRadius:2 }}
                />
              </div>

              <div style={{ marginTop:16 }}>
                <button
                  className={`btn btn-full ${asset.status === 'AVAILABLE' ? 'btn-primary' : 'btn-secondary'}`}
                  disabled={asset.status !== 'AVAILABLE'}
                  onClick={() => onSelectReserve(asset)}
                  id={`reserve-btn-${asset.id}`}
                >
                  <Calendar size={15} />
                  {asset.status === 'AVAILABLE' ? 'Reserve Equipment' : `Unavailable — ${asset.status}`}
                </button>

                {currentUser.role === 'VIP' && asset.status === 'AVAILABLE' && (
                  <div style={{ textAlign:'center', marginTop:'8px' }}>
                    <span style={{ fontSize:'0.72rem', color:'#a78bfa', display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}>
                      <Zap size={11} /> VIP Priority — Instant Confirmation
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
