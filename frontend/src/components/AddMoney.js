import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AddMoney = () => {
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Get user ID from localStorage or your auth context
  const userId = localStorage.getItem('userId');

  const handleAddMoney = async (e) => {
    e.preventDefault();
    
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post('http://localhost:8070/wallet/add-money', {
        userId: userId,
        amount: parseFloat(amount),
        transactionType: 'credit',
        description: 'Money added to wallet'
      });

      if (response.data.success) {
        alert('Money added successfully!');
        navigate('/wallet'); // Navigate back to wallet page
      } else {
        setError(response.data.message || 'Failed to add money');
      }
    } catch (err) {
      console.error('Add money error:', err);
      setError(err.response?.data?.message || 'Failed to add money. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card shadow">
            <div className="card-header bg-primary text-white">
              <h4 className="mb-0">Add Money to Wallet</h4>
            </div>
            <div className="card-body">
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}

              <form onSubmit={handleAddMoney}>
                <div className="mb-3">
                  <label htmlFor="amount" className="form-label">
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    id="amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount"
                    min="1"
                    step="0.01"
                    required
                  />
                  <small className="text-muted">
                    Minimum amount: ₹1
                  </small>
                </div>

                <div className="d-grid gap-2">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Processing...
                      </>
                    ) : (
                      'Add Money'
                    )}
                  </button>
                  
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => navigate('/wallet')}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                </div>
              </form>

              <div className="mt-4">
                <h6>Quick Add Options:</h6>
                <div className="d-flex gap-2 flex-wrap">
                  {[100, 500, 1000, 2000, 5000].map((quickAmount) => (
                    <button
                      key={quickAmount}
                      className="btn btn-outline-primary btn-sm"
                      onClick={() => setAmount(quickAmount.toString())}
                      type="button"
                    >
                      ₹{quickAmount}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddMoney;