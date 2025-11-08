import React, { useState, useEffect } from 'react';

export default function SellerWalletPage() {
  const [sellerId, setSellerId] = useState('');
  const [walletData, setWalletData] = useState({
    balance: 0,
    totalSpent: 0,
    totalRefunded: 0,
    walletStatus: 'active'
  });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [showTopUp, setShowTopUp] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filteredTransactions, setFilteredTransactions] = useState([]);

  const BASE_URL = 'https://agrihub-2.onrender.com';

  // Inject CSS to hide Government / Login / Register links while this page is mounted.
  useEffect(() => {
    const styleId = 'hide-auth-links-wallet';
    if (document.getElementById(styleId)) return;
    const css = `
      .navbar a[href="/GovernmentPage"],
      .navbar a[href="/login"],
      .navbar a[href="/register"],
      .navbar .login,
      .navbar .register,
      .navbar .gov-link,
      a.gov-link,
      a.nav-gov,
      a[href="/GovernmentPage"] .badge,
      .navbar .badge.gov {
        display: none !important;
      }
    `;
    const styleEl = document.createElement('style');
    styleEl.id = styleId;
    styleEl.textContent = css;
    document.head.appendChild(styleEl);

    return () => {
      const el = document.getElementById(styleId);
      if (el) el.parentNode.removeChild(el);
    };
  }, []);

  useEffect(() => {
    fetchWalletData();
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchWalletData();
      }
    };
    
    const handleFocus = () => {
      fetchWalletData();
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const fetchWalletData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch(`${BASE_URL}/seller/userdata`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });

      const data = await res.json();
      if (data.status === 'ok' && data.data) {
        const id = data.data._id;
        setSellerId(id);

        const walletRes = await fetch(`${BASE_URL}/wallet/${id}`);
        const walletData = await walletRes.json();
        if (walletData.status === 'ok') {
          setWalletData({
            balance: walletData.balance || 0,
            totalSpent: walletData.totalSpent || 0,
            totalRefunded: walletData.totalRefunded || 0,
            walletStatus: walletData.walletStatus || 'active'
          });
        }

        const txRes = await fetch(`${BASE_URL}/transactions/${id}?limit=20`);
        const txData = await txRes.json();
        if (txData.status === 'ok') {
          const txList = txData.transactions || [];
          setTransactions(txList);
          setFilteredTransactions(txList);
        }
      }
    } catch (error) {
      console.error('Error fetching wallet data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTopUp = async () => {
    if (!topUpAmount || Number(topUpAmount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    setProcessing(true);

    try {
      const response = await fetch(`${BASE_URL}/wallet/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sellerId: sellerId,
          amount: Number(topUpAmount),
          description: 'Wallet top-up',
          paymentMethod: 'wallet'
        })
      });

      const result = await response.json();

      if (result.status === 'ok') {
        const newBalance = result.newBalance || (walletData.balance + Number(topUpAmount));
        setWalletData(prev => ({
          ...prev,
          balance: newBalance
        }));

        alert(`Successfully added Rs. ${Number(topUpAmount).toFixed(2)} to your wallet!\n\nNew Balance: Rs. ${newBalance.toFixed(2)}`);
        
        setTopUpAmount('');
        setShowTopUp(false);
        
        fetchWalletData();
      } else {
        alert('Failed to add money: ' + result.message);
      }
    } catch (error) {
      console.error('Error topping up:', error);
      alert('Failed to process payment');
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filterTransactionsByDate = () => {
    if (!startDate && !endDate) {
      setFilteredTransactions(transactions);
      return;
    }

    const filtered = transactions.filter(tx => {
      const txDate = new Date(tx.transactionDate);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;

      if (end) {
        end.setHours(23, 59, 59, 999);
      }

      if (start && end) {
        return txDate >= start && txDate <= end;
      } else if (start) {
        return txDate >= start;
      } else if (end) {
        return txDate <= end;
      }
      return true;
    });

    setFilteredTransactions(filtered);
  };

  const clearDateFilter = () => {
    setStartDate('');
    setEndDate('');
    setFilteredTransactions(transactions);
  };

  const downloadCSV = () => {
    if (filteredTransactions.length === 0) {
      alert('No transactions to download');
      return;
    }

    const headers = ['Date', 'Description', 'Type', 'Amount', 'Payment Method', 'Status', 'Refund'];
    const csvData = filteredTransactions.map(tx => [
      new Date(tx.transactionDate).toLocaleString('en-US'),
      tx.description,
      tx.type,
      tx.amount.toFixed(2),
      tx.paymentMethod,
      tx.status || 'completed',
      tx.isRefund ? 'Yes' : 'No'
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    const dateRange = startDate && endDate 
      ? `_${startDate}_to_${endDate}` 
      : startDate 
      ? `_from_${startDate}` 
      : endDate 
      ? `_until_${endDate}` 
      : '';
    
    link.setAttribute('href', url);
    link.setAttribute('download', `agrihub_transactions${dateRange}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    filterTransactionsByDate();
  }, [startDate, endDate, transactions]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
        <div className="text-center">
          <div className="relative mb-6">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-green-200 border-t-green-600 mx-auto"></div>
            <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-4xl">🌱</span>
          </div>
          <p className="text-gray-700 text-xl font-semibold animate-pulse">Loading your wallet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-4 md:p-8 relative overflow-hidden">
      {/* Decorative plant elements */}
      <div className="fixed top-0 left-0 w-64 h-64 opacity-10 pointer-events-none">
        <div className="text-9xl">🌿</div>
      </div>
      <div className="fixed bottom-0 right-0 w-64 h-64 opacity-10 pointer-events-none">
        <div className="text-9xl">🍃</div>
      </div>
      <div className="fixed top-1/4 right-1/4 w-32 h-32 opacity-5 pointer-events-none">
        <div className="text-6xl">🌾</div>
      </div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-3 mb-4">
            <span className="text-5xl">🌱</span>
            <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600">
              AgriHub Wallet
            </h1>
            <span className="text-5xl">🌾</span>
          </div>
          <p className="text-gray-600 text-lg">Your Agricultural Finance Hub</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="relative bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600 rounded-3xl shadow-2xl p-8 text-white overflow-hidden transform hover:scale-105 transition-all duration-300">
              {/* Leaf patterns */}
              <div className="absolute top-0 right-0 text-9xl opacity-10">🍃</div>
              <div className="absolute bottom-0 left-0 text-7xl opacity-10">🌿</div>
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white bg-opacity-20 rounded-2xl backdrop-blur-sm">
                      <span className="text-3xl">💰</span>
                    </div>
                    <div>
                      <p className="text-white text-opacity-80 text-sm mb-1">Main Wallet</p>
                      <h2 className="text-3xl font-bold">Balance</h2>
                    </div>
                  </div>
                  <span className={`px-4 py-2 rounded-full text-sm font-bold backdrop-blur-sm ${
                    walletData.walletStatus === 'active' 
                      ? 'bg-green-400 bg-opacity-30 text-green-100 border-2 border-green-300' 
                      : 'bg-red-400 bg-opacity-30 text-red-100 border-2 border-red-300'
                  }`}>
                    {walletData.walletStatus.toUpperCase()}
                  </span>
                </div>
                
                <div className="mb-8">
                  <p className="text-white text-opacity-70 text-base mb-3 flex items-center gap-2">
                    <span>💵</span>
                    Available Balance
                  </p>
                  <p className="text-6xl md:text-7xl font-black tracking-tight">
                    ₹{walletData.balance.toFixed(2)}
                  </p>
                </div>
                
                <button
                  onClick={() => setShowTopUp(!showTopUp)}
                  className="bg-white text-green-600 px-8 py-4 rounded-2xl font-bold hover:bg-opacity-90 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center gap-3 group"
                >
                  <span className="text-2xl group-hover:animate-bounce">💸</span>
                  <span>{showTopUp ? 'Cancel Top Up' : 'Add Money'}</span>
                </button>
              </div>
            </div>

            {showTopUp && (
              <div className="mt-6 bg-white rounded-3xl shadow-xl p-8 border-4 border-green-200">
                <h3 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-6 flex items-center gap-3">
                  <span className="text-4xl">🌱</span>
                  Add Money
                </h3>
                
                <div className="mb-6">
                  <label className="block text-gray-800 font-bold mb-3 text-lg">Amount</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl font-bold">₹</span>
                    <input
                      type="number"
                      value={topUpAmount}
                      onChange={(e) => setTopUpAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-10 pr-4 py-4 border-4 border-green-200 rounded-2xl focus:border-green-500 focus:ring-4 focus:ring-green-100 focus:outline-none text-2xl font-bold transition-all"
                      min="1"
                      step="0.01"
                    />
                  </div>
                  <div className="grid grid-cols-4 gap-3 mt-4">
                    {[100, 500, 1000, 5000].map((amount) => (
                      <button
                        key={amount}
                        onClick={() => setTopUpAmount(amount.toString())}
                        className="px-4 py-3 bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-600 hover:to-emerald-600 hover:text-white rounded-xl transition-all font-bold text-gray-700 border-2 border-green-200 hover:border-green-400 transform hover:scale-105"
                      >
                        ₹{amount}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={handleTopUp}
                    disabled={processing || !topUpAmount || Number(topUpAmount) <= 0}
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-4 rounded-2xl font-bold hover:from-green-700 hover:to-emerald-700 transition-all disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:transform-none"
                  >
                    {processing ? (
                      <>
                        <div className="animate-spin rounded-full h-6 w-6 border-3 border-white border-t-transparent"></div>
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <span className="text-2xl">💰</span>
                        <span>Add ₹{topUpAmount || '0'}</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setShowTopUp(false);
                      setTopUpAmount('');
                    }}
                    className="px-8 py-4 border-4 border-green-200 rounded-2xl font-bold hover:bg-green-50 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-3xl shadow-xl p-6 border-4 border-green-200 hover:shadow-2xl transition-all transform hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl">
                  <span className="text-3xl">📉</span>
                </div>
                <span className="text-sm text-gray-500 font-bold uppercase tracking-wide">Total Spent</span>
              </div>
              <p className="text-4xl font-black text-gray-900">₹{walletData.totalSpent.toFixed(2)}</p>
              <p className="text-sm text-gray-500 mt-2 flex items-center gap-1">
                <span>🌾</span>
                Lifetime spending
              </p>
            </div>
            
            <div className="bg-white rounded-3xl shadow-xl p-6 border-4 border-emerald-200 hover:shadow-2xl transition-all transform hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-2xl">
                  <span className="text-3xl">💸</span>
                </div>
                <span className="text-sm text-gray-500 font-bold uppercase tracking-wide">Refunded</span>
              </div>
              <p className="text-4xl font-black text-gray-900">₹{walletData.totalRefunded.toFixed(2)}</p>
              <p className="text-sm text-gray-500 mt-2 flex items-center gap-1">
                <span>🔄</span>
                Total refunds
              </p>
            </div>
            
            <div className="bg-white rounded-3xl shadow-xl p-6 border-4 border-teal-200 hover:shadow-2xl transition-all transform hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-teal-100 to-teal-200 rounded-2xl">
                  <span className="text-3xl">📋</span>
                </div>
                <span className="text-sm text-gray-500 font-bold uppercase tracking-wide">Transactions</span>
              </div>
              <p className="text-4xl font-black text-gray-900">{transactions.length}</p>
              <p className="text-sm text-gray-500 mt-2 flex items-center gap-1">
                <span>⏱️</span>
                Recent activity
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-3xl shadow-xl p-8 border-4 border-green-200">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent flex items-center gap-3">
              <span className="text-4xl">📜</span>
              Transaction History
            </h3>
            <div className="flex items-center gap-2 text-gray-500">
              <span className="text-2xl">⏰</span>
              <span className="text-sm font-semibold">Last 20 transactions</span>
            </div>
          </div>

          {/* Date Filter Section */}
          <div className="mb-6 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border-3 border-green-200">
            <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="text-2xl">📅</span>
              Filter by Date Range
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-green-300 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 focus:outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-green-300 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 focus:outline-none transition-all"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={clearDateFilter}
                  className="w-full px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                >
                  <span className="text-xl">🔄</span>
                  Clear Filter
                </button>
              </div>
              <div className="flex items-end">
                <button
                  onClick={downloadCSV}
                  disabled={filteredTransactions.length === 0}
                  className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-bold transition-all disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:transform-none"
                >
                  <span className="text-xl">📥</span>
                  Download CSV
                </button>
              </div>
            </div>
            {(startDate || endDate) && (
              <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
                <span className="text-lg">ℹ️</span>
                <span className="font-semibold">
                  Showing {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''}
                  {startDate && endDate && ` from ${startDate} to ${endDate}`}
                  {startDate && !endDate && ` from ${startDate} onwards`}
                  {!startDate && endDate && ` until ${endDate}`}
                </span>
              </div>
            )}
          </div>
          
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-9xl mb-6">🌱</div>
              <p className="text-gray-600 text-xl font-semibold mb-2">
                {transactions.length === 0 ? 'No transactions yet' : 'No transactions found for selected dates'}
              </p>
              <p className="text-gray-400">
                {transactions.length === 0 ? 'Your transaction history will appear here' : 'Try adjusting your date filter'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTransactions.map((tx) => (
                <div 
                  key={tx._id} 
                  className="flex items-center justify-between p-5 border-4 border-green-100 rounded-2xl hover:border-green-300 hover:shadow-lg transition-all transform hover:-translate-y-1 bg-gradient-to-r hover:from-green-50 hover:to-emerald-50"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-4 rounded-2xl text-3xl ${
                      tx.type === 'credit' 
                        ? 'bg-gradient-to-br from-green-100 to-green-200' 
                        : 'bg-gradient-to-br from-red-100 to-red-200'
                    }`}>
                      {tx.type === 'credit' ? '💰' : '💸'}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-lg">{tx.description}</p>
                      <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                        <span className="font-medium">📅 {formatDate(tx.transactionDate)}</span>
                        <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                        <span className="capitalize font-medium">{tx.paymentMethod}</span>
                        {tx.status === 'completed' && (
                          <>
                            <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                            <span className="text-green-600 font-semibold">✅ Completed</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-2xl font-black ${
                      tx.type === 'credit' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {tx.type === 'credit' ? '+' : '-'}₹{tx.amount.toFixed(2)}
                    </p>
                    {tx.isRefund && (
                      <span className="inline-block text-xs bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full font-bold mt-1">
                        🔄 Refund
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Floating Back Button */}
        <button
          onClick={() => window.location.href = '/regseller'}
          className="fixed bottom-8 right-8 bg-white text-black px-6 py-4 rounded-2xl shadow-2xl hover:shadow-3xl transition-all transform hover:scale-110 hover:-translate-y-1 z-50 group flex items-center gap-3 border-4 border-green-200 hover:border-green-500"
          title="Back to Seller Page"
        >
          <span className="text-2xl group-hover:animate-bounce">🏠</span>
          <span className="font-bold text-lg">Back</span>
        </button>
      </div>
    </div>
  );
}
