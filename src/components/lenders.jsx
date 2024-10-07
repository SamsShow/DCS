import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { motion } from 'framer-motion';
import { 
  Wallet, 
  PiggyBank, 
  BarChart3,
  AlertCircle,
  Plus,
  RefreshCw,
  List
} from 'lucide-react';
import { contractAddress, contractABI } from '../config/contractAddress';

const Card = ({ children, className = '' }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -5 }}
    transition={{ duration: 0.3 }}
    className={`bg-white/80 backdrop-blur-sm shadow-lg rounded-2xl p-6 border border-emerald-100 ${className}`}
  >
    {children}
  </motion.div>
);

const Button = ({ onClick, disabled, variant = 'primary', children, icon: Icon }) => {
  const baseStyle = "w-full flex items-center justify-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 disabled:cursor-not-allowed";
  const variants = {
    primary: `${disabled ? 'bg-gray-400' : 'bg-emerald-600 hover:bg-emerald-700'} text-white`,
    secondary: `${disabled ? 'bg-gray-400' : 'bg-emerald-100 hover:bg-emerald-200'} text-emerald-800`,
    danger: `${disabled ? 'bg-gray-400' : 'bg-red-600 hover:bg-red-700'} text-white`,
  };

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyle} ${variants[variant]}`}
    >
      {Icon && <Icon size={20} />}
      <span>{children}</span>
    </motion.button>
  );
};

const Input = ({ value, onChange, placeholder, type = 'number', disabled }) => (
  <motion.input
    whileFocus={{ scale: 1.02 }}
    type={type}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    disabled={disabled}
    className="w-full px-4 py-3 rounded-xl border border-emerald-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all duration-300 disabled:bg-gray-100"
  />
);

const ErrorMessage = ({ message }) => (
  <motion.div
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-xl flex items-center space-x-2"
  >
    <AlertCircle size={20} />
    <span>{message}</span>
  </motion.div>
);

const LenderPage = () => {
  const [contract, setContract] = useState(null);
  const [poolId, setPoolId] = useState('');
  const [amount, setAmount] = useState('');
  const [poolCount, setPoolCount] = useState(0);
  const [riskPools, setRiskPools] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const initializeContract = async () => {
      if (window.ethereum) {
        try {
          await window.ethereum.request({ method: 'eth_requestAccounts' });
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          const contractInstance = new ethers.Contract(contractAddress, contractABI, signer);
          setContract(contractInstance);
        } catch (error) {
          console.error('Error initializing contract:', error);
          setError("Failed to initialize contract. Please check your connection and try again.");
        }
      } else {
        setError("Please install MetaMask!");
      }
    };

    initializeContract();
  }, []);

  const handleAddFunds = async () => {
    try {
      setLoading(true);
      setError('');

      if (!contract) throw new Error('Contract not initialized. Please try again.');
      if (!poolId || !amount) throw new Error('Please fill in all fields');

      const amountInWei = ethers.parseEther(amount);
      const tx = await contract.addFunds(poolId, amountInWei);
      await tx.wait();

      setPoolId('');
      setAmount('');
      alert('Funds added successfully!');
    } catch (err) {
      setError(err.message || 'Failed to add funds');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGetRiskPools = async () => {
    try {
      setLoading(true);
      setError('');

      if (!contract) throw new Error('Contract not initialized. Please try again.');

      // Assuming the contract has a method to get all risk pools
      // If not, we might need to adjust this part based on the actual contract structure
      const poolCount = await contract.poolCount();
      let pools = [];
      for (let i = 0; i < poolCount; i++) {
        const pool = await contract.riskPools(i);
        pools.push({
          id: i,
          totalFunds: pool.totalFunds,
          availableFunds: pool.availableFunds,
          riskLevel: pool.riskLevel
        });
      }
      setRiskPools(pools);
    } catch (err) {
      setError(err.message || 'Failed to fetch risk pools');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGetPoolCount = async () => {
    try {
      setLoading(true);
      setError('');

      if (!contract) throw new Error('Contract not initialized. Please try again.');

      const count = await contract.poolCount();
      setPoolCount(count.toNumber());
    } catch (err) {
      setError(err.message || 'Failed to fetch pool count');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto space-y-8 p-4"
    >
      <motion.div
        initial={{ x: -20 }}
        animate={{ x: 0 }}
        className="flex items-center space-x-4 mb-8"
      >
        <PiggyBank size={32} className="text-emerald-600" />
        <h2 className="text-3xl font-bold text-gray-900">Lender Dashboard</h2>
      </motion.div>

      {error && <ErrorMessage message={error} />}

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Add Funds to Pool</h3>
            <Wallet className="text-emerald-600" size={24} />
          </div>
          <div className="space-y-4">
            <Input
              value={poolId}
              onChange={(e) => setPoolId(e.target.value)}
              placeholder="Pool ID"
              disabled={loading}
            />
            <Input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Amount (in ETH)"
              disabled={loading}
            />
            <Button
              onClick={handleAddFunds}
              disabled={loading}
              icon={Plus}
            >
              {loading ? 'Processing...' : 'Add Funds'}
            </Button>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Pool Information</h3>
            <BarChart3 className="text-emerald-600" size={24} />
          </div>
          <div className="space-y-4">
            <Button
              onClick={handleGetPoolCount}
              disabled={loading}
              variant="secondary"
              icon={RefreshCw}
            >
              {loading ? 'Processing...' : 'Get Pool Count'}
            </Button>
            {poolCount > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-emerald-50 rounded-xl p-6 text-center"
              >
                <p className="text-sm text-emerald-600 mb-2">Total number of pools</p>
                <p className="text-4xl font-bold text-emerald-800">{poolCount}</p>
              </motion.div>
            )}
          </div>
        </Card>

        <Card className="md:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Risk Pools</h3>
            <List className="text-emerald-600" size={24} />
          </div>
          <div className="space-y-4">
            <Button
              onClick={handleGetRiskPools}
              disabled={loading}
              variant="secondary"
              icon={RefreshCw}
            >
              {loading ? 'Processing...' : 'Get Risk Pools'}
            </Button>
            {riskPools.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {riskPools.map((pool, index) => (
                  <div key={index} className="bg-emerald-50 rounded-xl p-6">
                    <p className="text-lg font-semibold text-emerald-800">Pool ID: {pool.id.toString()}</p>
                    <p className="text-emerald-600">Total Funds: {ethers.formatEther(pool.totalFunds)} ETH</p>
                    <p className="text-emerald-600">Available Funds: {ethers.formatEther(pool.availableFunds)} ETH</p>
                    <p className="text-emerald-600">Risk Level: {pool.riskLevel.toString()}</p>
                  </div>
                ))}
              </motion.div>
            )}
          </div>
        </Card>
      </div>
    </motion.div>
  );
};

export default LenderPage;