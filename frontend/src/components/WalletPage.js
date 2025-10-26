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
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    cardHolder: '',
    expiryDate: '',
    cvv: ''
  });
  const [processing, setProcessing] = useState(false);

  const BASE_URL = 'http://localhost:8070';

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
          setTransactions(txData.transactions || []);
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

    if (paymentMethod === 'card') {
      if (!cardDetails.cardNumber || !cardDetails.cardHolder || 
          !cardDetails.expiryDate || !cardDetails.cvv) {
        alert('Please fill in all card details');
        return;
      }
      
      if (cardDetails.cardNumber.length < 16) {
        alert('Please enter a valid 16-digit card number');
        return;
      }
      
      if (cardDetails.cvv.length < 3) {
        alert('Please enter a valid CVV');
        return;
      }
    }

    setProcessing(true);

    try {
      const response = await fetch(`${BASE_URL}/wallet/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sellerId: sellerId,
          amount: Number(topUpAmount),
          description: `Wallet top-up via ${paymentMethod}`,
          paymentMethod: paymentMethod
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
        setCardDetails({ cardNumber: '', cardHolder: '', expiryDate: '', cvv: '' });
        
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

  const formatCardNumber = (value) => {
    const cleaned = value.replace(/\s/g, '');
    const chunks = cleaned.match(/.{1,4}/g);
    return chunks ? chunks.join(' ') : cleaned;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="text-center">
          <div className="relative mb-6">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-purple-200 border-t-purple-600 mx-auto"></div>
            <svg className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-purple-600" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"></path>
              <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"></path>
            </svg>
          </div>
          <p className="text-gray-700 text-xl font-semibold animate-pulse">Loading your wallet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-2">
            Wallet Dashboard
          </h1>
          <p className="text-gray-600 text-lg">Manage your funds with ease</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-3xl shadow-2xl p-8 text-white overflow-hidden transform hover:scale-105 transition-all duration-300">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 rounded-full -ml-24 -mb-24"></div>
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white bg-opacity-20 rounded-2xl backdrop-blur-sm">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"></path>
                        <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"></path>
                      </svg>
                    </div>
                    <div>
                      <p className="text-white text-opacity-80 text-sm mb-1">Main Wallet</p>
                      <h2 className="text-3xl font-bold">Balance</h2>
                    </div>
                  </div>
                  <span className={`px-4 py-2 rounded-full text-sm font-bold backdrop-blur-sm ${
                    walletData.walletStatus === 'active' 
                      ? 'bg-green-400 bg-opacity-30 text-green-100 border border-green-300' 
                      : 'bg-red-400 bg-opacity-30 text-red-100 border border-red-300'
                  }`}>
                    {walletData.walletStatus.toUpperCase()}
                  </span>
                </div>
                
                <div className="mb-8">
                  <p className="text-white text-opacity-70 text-base mb-3">Available Balance</p>
                  <p className="text-6xl md:text-7xl font-black tracking-tight">
                    ₹{walletData.balance.toFixed(2)}
                  </p>
                </div>
                
                <button
                  onClick={() => setShowTopUp(!showTopUp)}
                  className="bg-white text-purple-600 px-8 py-4 rounded-2xl font-bold hover:bg-opacity-90 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center gap-3 group"
                >
                  <svg className="group-hover:animate-bounce" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 19V5M5 12l7-7 7 7"/>
                  </svg>
                  <span>{showTopUp ? 'Cancel Top Up' : 'Add Money'}</span>
                </button>
              </div>
            </div>

            {showTopUp && (
              <div className="mt-6 bg-white rounded-3xl shadow-xl p-8 border border-purple-100">
                <h3 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-6">
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
                      className="w-full pl-10 pr-4 py-4 border-2 border-gray-200 rounded-2xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 focus:outline-none text-2xl font-bold transition-all"
                      min="1"
                      step="0.01"
                    />
                  </div>
                  <div className="grid grid-cols-4 gap-3 mt-4">
                    {[100, 500, 1000, 5000].map((amount) => (
                      <button
                        key={amount}
                        onClick={() => setTopUpAmount(amount.toString())}
                        className="px-4 py-3 bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-600 hover:to-purple-600 hover:text-white rounded-xl transition-all font-bold text-gray-700 border-2 border-transparent hover:border-purple-400 transform hover:scale-105"
                      >
                        ₹{amount}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-gray-800 font-bold mb-4 text-lg">Payment Method</label>
                  <label className={`flex items-center p-5 border-2 rounded-2xl cursor-pointer transition-all ${
                    paymentMethod === 'card' 
                      ? 'border-purple-500 bg-gradient-to-r from-indigo-50 to-purple-50 shadow-lg' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="card"
                      checked={paymentMethod === 'card'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mr-4 w-5 h-5 text-purple-600"
                    />
                    <svg className="mr-3 text-purple-600" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                      <line x1="1" y1="10" x2="23" y2="10"></line>
                    </svg>
                    <span className="font-bold text-gray-800 text-lg">Debit/Credit Card</span>
                  </label>
                </div>

                {paymentMethod === 'card' && (
                  <div className="space-y-5 mb-6 p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border border-gray-200">
                    <div>
                      <label className="block text-gray-800 font-bold mb-2">Card Number</label>
                      <input
                        type="text"
                        value={formatCardNumber(cardDetails.cardNumber)}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\s/g, '');
                          if (value.length <= 16 && /^\d*$/.test(value)) {
                            setCardDetails({...cardDetails, cardNumber: value});
                          }
                        }}
                        placeholder="1234 5678 9012 3456"
                        maxLength="19"
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 focus:outline-none font-mono text-lg transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-800 font-bold mb-2">Card Holder Name</label>
                      <input
                        type="text"
                        value={cardDetails.cardHolder}
                        onChange={(e) => setCardDetails({...cardDetails, cardHolder: e.target.value.toUpperCase()})}
                        placeholder="JOHN DOE"
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 focus:outline-none font-semibold transition-all"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-800 font-bold mb-2">Expiry Date</label>
                        <input
                          type="text"
                          value={cardDetails.expiryDate}
                          onChange={(e) => {
                            let value = e.target.value.replace(/\D/g, '');
                            if (value.length >= 2) value = value.slice(0, 2) + '/' + value.slice(2, 4);
                            setCardDetails({...cardDetails, expiryDate: value});
                          }}
                          placeholder="MM/YY"
                          maxLength="5"
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 focus:outline-none font-mono transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-800 font-bold mb-2">CVV</label>
                        <input
                          type="password"
                          value={cardDetails.cvv}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value.length <= 3 && /^\d*$/.test(value)) {
                              setCardDetails({...cardDetails, cvv: value});
                            }
                          }}
                          placeholder="123"
                          maxLength="3"
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 focus:outline-none font-mono transition-all"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-4">
                  <button
                    onClick={handleTopUp}
                    disabled={processing || !topUpAmount || Number(topUpAmount) <= 0}
                    className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-2xl font-bold hover:from-indigo-700 hover:to-purple-700 transition-all disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:transform-none"
                  >
                    {processing ? (
                      <>
                        <div className="animate-spin rounded-full h-6 w-6 border-3 border-white border-t-transparent"></div>
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 19V5M5 12l7-7 7 7"/>
                        </svg>
                        <span>Add ₹{topUpAmount || '0'}</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setShowTopUp(false);
                      setTopUpAmount('');
                      setCardDetails({ cardNumber: '', cardHolder: '', expiryDate: '', cvv: '' });
                    }}
                    className="px-8 py-4 border-2 border-gray-300 rounded-2xl font-bold hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-3xl shadow-xl p-6 border border-indigo-100 hover:shadow-2xl transition-all transform hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-2xl">
                  <svg className="text-indigo-600" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
                    <polyline points="16 7 22 7 22 13"></polyline>
                  </svg>
                </div>
                <span className="text-sm text-gray-500 font-bold uppercase tracking-wide">Total Spent</span>
              </div>
              <p className="text-4xl font-black text-gray-900">₹{walletData.totalSpent.toFixed(2)}</p>
              <p className="text-sm text-gray-500 mt-2">Lifetime spending</p>
            </div>
            
            <div className="bg-white rounded-3xl shadow-xl p-6 border border-green-100 hover:shadow-2xl transition-all transform hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl">
                  <svg className="text-green-600" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M19 12l-7 7-7-7"/>
                  </svg>
                </div>
                <span className="text-sm text-gray-500 font-bold uppercase tracking-wide">Refunded</span>
              </div>
              <p className="text-4xl font-black text-gray-900">₹{walletData.totalRefunded.toFixed(2)}</p>
              <p className="text-sm text-gray-500 mt-2">Total refunds</p>
            </div>
            
            <div className="bg-white rounded-3xl shadow-xl p-6 border border-purple-100 hover:shadow-2xl transition-all transform hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl">
                  <svg className="text-purple-600" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                </div>
                <span className="text-sm text-gray-500 font-bold uppercase tracking-wide">Transactions</span>
              </div>
              <p className="text-4xl font-black text-gray-900">{transactions.length}</p>
              <p className="text-sm text-gray-500 mt-2">Recent activity</p>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Transaction History
            </h3>
            <div className="flex items-center gap-2 text-gray-500">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              <span className="text-sm font-semibold">Last 20 transactions</span>
            </div>
          </div>
          
          {transactions.length === 0 ? (
            <div className="text-center py-16">
              <div className="flex justify-center mb-6">
                <div className="p-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full">
                  <svg className="text-gray-400" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"></path>
                    <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"></path>
                  </svg>
                </div>
              </div>
              <p className="text-gray-600 text-xl font-semibold mb-2">No transactions yet</p>
              <p className="text-gray-400">Your transaction history will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div 
                  key={tx._id} 
                  className="flex items-center justify-between p-5 border-2 border-gray-100 rounded-2xl hover:border-purple-200 hover:shadow-lg transition-all transform hover:-translate-y-1 bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-4 rounded-2xl ${
                      tx.type === 'credit' 
                        ? 'bg-gradient-to-br from-green-100 to-green-200' 
                        : 'bg-gradient-to-br from-red-100 to-red-200'
                    }`}>
                      {tx.type === 'credit' ? (
                        <svg className="text-green-600" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 19V5M5 12l7-7 7 7"/>
                        </svg>
                      ) : (
                        <svg className="text-red-600" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 5v14M19 12l-7 7-7-7"/>
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-lg">{tx.description}</p>
                      <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                        <span className="font-medium">{formatDate(tx.transactionDate)}</span>
                        <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                        <span className="capitalize font-medium">{tx.paymentMethod}</span>
                        {tx.status === 'completed' && (
                          <>
                            <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                            <div className="flex items-center gap-1">
                              <svg className="text-green-500" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                <polyline points="22 4 12 14.01 9 11.01"></polyline>
                              </svg>
                              <span className="text-green-600 font-semibold">Completed</span>
                            </div>
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
                        Refund
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
          className="fixed bottom-8 right-8 bg-white text-black px-6 py-4 rounded-2xl shadow-2xl hover:shadow-3xl transition-all transform hover:scale-110 hover:-translate-y-1 z-50 group flex items-center gap-3 border-2 border-gray-200 hover:border-purple-500"
          title="Back to Seller Page"
        >
          <svg className="w-6 h-6 text-black group-hover:animate-bounce" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          <span className="font-bold text-lg">Back</span>
        </button>
      </div>
    </div>
  );
}