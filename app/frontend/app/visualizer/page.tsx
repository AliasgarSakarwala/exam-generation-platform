"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, notFound } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Loading from '@/app/loading';
import { TableIcon, Eye, Plug, Download, Search, X, FileText, FileCode, FileSpreadsheet } from 'lucide-react';
import { getTables } from '@/services/visualizer';
import toast from 'react-hot-toast';
import DataTable from 'react-data-table-component';

export default function DatabaseVisualizer() {
  const router = useRouter();
  const { user } = useAuth();
  const [tables, setTables] = useState<any>({});
  const [tableNames, setTableNames] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [darkMode, setDarkMode] = useState(false);
  const [exportModal, setExportModal] = useState({
    open: false,
    tableName: '',
    loading: false,
    activeFormat: null as 'CSV' | 'JSON' | 'Excel' | null
  });

  // Fetch tables data
  const fetchTables = async () => {
    try {
      setIsLoading(true);
      const response = await getTables();

      if (response.status === 200) {
        let records = 0;
        const tableData = response.data.data;

        for (const tableName of Object.keys(tableData)) {
          records += Number(tableData[tableName].total);
        }

        console.log("tableData", tableData);

        setTotalRecords(records);
        setTables(tableData);
        setTableNames(Object.keys(tableData));
      } else {
        throw new Error('Failed to fetch tables');
      }
    } catch (err) {
      toast.error('Failed to load tables ❌', {
        position: "bottom-center",
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  // Check for admin access
  if (!user || isLoading) {
    return <Loading />;
  }

  if (user && user.role !== 'Admin') {
    router.replace('/404');
  }

  // Filter tables based on search query
  const filteredTableNames = searchQuery
    ? tableNames.filter(name => name.toLowerCase().includes(searchQuery.toLowerCase()))
    : tableNames;

  // Export table data
  const handleExport = (format: 'CSV' | 'JSON' | 'Excel') => {
    if (!exportModal.tableName || !tables[exportModal.tableName]) return;

    setExportModal(prev => ({ ...prev, loading: true }));

    try {
      const table = tables[exportModal.tableName];
      const headers = table.headers;
      const rows = table.rows;

      let data, mimeType, fileExtension;

      switch (format) {
        case 'CSV':
          const csvHeaders = headers.map((h: string) => `"${h.replace(/"/g, '""')}"`).join(',');
          const csvRows = rows.map((row: any) =>
            headers.map((header: string | number) => `"${String(row[header] || 'NULL').replace(/"/g, '""')}"`).join(',')
          );
          data = [csvHeaders, ...csvRows].join('\r\n');
          mimeType = 'text/csv;charset=utf-8;';
          fileExtension = 'csv';
          break;

        case 'JSON':
          const jsonData = rows.map((row: any) => {
            const obj: any = {};
            headers.forEach((header: string | number) => obj[header] = row[header] || 'NULL');
            return obj;
          });
          data = JSON.stringify(jsonData, null, 2);
          mimeType = 'application/json';
          fileExtension = 'json';
          break;

        case 'Excel':
          const excelHeaders = headers.map((h: string) => `"${h.replace(/"/g, '""')}"`).join('\t');
          const excelRows = rows.map((row: any) =>
            headers.map((header: string | number) => `"${String(row[header] || 'NULL').replace(/"/g, '""')}"`).join('\t')
          );
          data = [excelHeaders, ...excelRows].join('\r\n');
          mimeType = 'application/vnd.ms-excel';
          fileExtension = 'xls';
          break;

        default:
          throw new Error('Unsupported format');
      }

      const blob = new Blob(["\uFEFF" + data], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${exportModal.tableName}.${fileExtension}`;
      document.body.appendChild(a);
      a.click();

      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setExportModal(prev => ({ ...prev, loading: false, open: false }));
      }, 100);
    } catch (error) {
      toast.error('Export failed');
      setExportModal(prev => ({ ...prev, loading: false }));
    }
  };

  // Custom styles for DataTable
  const customStyles = {
    rows: {
      style: {
        minHeight: '48px',
        '&:not(:last-of-type)': {
          borderBottomWidth: '1px',
          borderBottomColor: darkMode ? '#374151' : '#e5e7eb',
        },
        '&:hover': {
          backgroundColor: darkMode ? 'rgba(55, 65, 81, 0.5)' : 'rgba(243, 244, 246, 0.5)',
        },
      },
    },
    headCells: {
      style: {
        paddingLeft: '16px',
        paddingRight: '16px',
        fontWeight: '600',
        textTransform: 'uppercase',
        fontSize: '0.75rem',
        color: darkMode ? '#9ca3af' : '#6b7280',
        backgroundColor: darkMode ? 'rgba(31, 41, 55, 0.5)' : 'rgba(249, 250, 251, 0.5)',
      },
    },
    cells: {
      style: {
        paddingLeft: '16px',
        paddingRight: '16px',
        color: darkMode ? '#e5e7eb' : '#111827',
      },
    },
    pagination: {
      style: {
        color: darkMode ? '#e5e7eb' : '#111827',
        backgroundColor: darkMode ? '#1f2937' : '#f9fafb',
        borderTopWidth: '1px',
        borderTopColor: darkMode ? '#374151' : '#e5e7eb',
      },
    },
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-gray-900 text-gray-200' : 'bg-gray-50 text-gray-800'}`} data-testid="viz">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className={`text-3xl md:text-4xl font-bold bg-gradient-to-r ${darkMode ? 'from-indigo-400 to-indigo-600' : 'from-indigo-600 to-indigo-800'} bg-clip-text text-transparent`}>
              <span className="inline-flex items-center">
                <TableIcon className="w-8 h-8 mr-2" />
                Database Visualizer
              </span>
            </h1>

          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-full ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm hover:shadow-md transition-all duration-300 group`}
              title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {darkMode ? (
                <span className="text-gray-400 group-hover:text-yellow-400 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="5"></circle>
                    <line x1="12" y1="1" x2="12" y2="3"></line>
                    <line x1="12" y1="21" x2="12" y2="23"></line>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                    <line x1="1" y1="12" x2="3" y2="12"></line>
                    <line x1="21" y1="12" x2="23" y2="12"></line>
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                  </svg>
                </span>
              ) : (
                <span className="text-gray-500 group-hover:text-indigo-600 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                  </svg>
                </span>
              )}
            </button>
          </div>
        </header>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-2xl mx-auto">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="text-gray-400 w-4 h-4" />
            </div>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              type="text"
              className={`block w-full pl-12 pr-10 py-3 border ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'} rounded-xl focus:outline-none focus:ring-2 ${darkMode ? 'focus:ring-indigo-500' : 'focus:ring-indigo-600'} focus:border-transparent shadow-sm transition-all duration-300 hover:shadow-md`}
              placeholder="Search tables..."
            />
            {searchQuery && (
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <button
                  onClick={() => setSearchQuery('')}
                  className={`p-1 rounded-full ${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'} transition-colors`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
          {/* Tables Loaded */}
          <div
            className={`p-5 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-100 bg-white'} overflow-hidden relative`}
          >
            <div className={`absolute top-0 right-0 w-16 h-16 rounded-bl-full ${darkMode ? 'bg-indigo-900/20' : 'bg-indigo-100'} opacity-50`}></div>
            <h3 className={`font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Tables Loaded</h3>
            <p className="text-3xl font-bold" data-testid="viz-tables-loaded">{tableNames.length}</p>
            <div className={`mt-2 text-sm ${darkMode ? 'text-indigo-400' : 'text-indigo-600'} flex items-center`}>
              <TableIcon className="w-4 h-4 mr-2" />
              <span>View all tables</span>
            </div>
          </div>

          {/* Total Records */}
          <div
            className={`p-5 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-100 bg-white'} overflow-hidden relative`}
          >
            <div className={`absolute top-0 right-0 w-16 h-16 rounded-bl-full ${darkMode ? 'bg-green-900/20' : 'bg-green-100'} opacity-50`}></div>
            <h3 className={`font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Total Records</h3>
            <p className="text-3xl font-bold" data-testid="viz-total-records">{totalRecords}</p>
            <div className={`mt-2 text-sm ${darkMode ? 'text-green-400' : 'text-green-600'} flex items-center`}>
              <Eye className="w-4 h-4 mr-2" />
              <span>Across all tables</span>
            </div>
          </div>

          {/* Database Status */}
          <div
            className={`p-5 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-100 bg-white'} overflow-hidden relative`}
          >
            <div className={`absolute top-0 right-0 w-16 h-16 rounded-bl-full ${darkMode ? 'bg-yellow-900/20' : 'bg-yellow-100'} opacity-50`}></div>
            <h3 className={`font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Database Status</h3>
            <p className="text-3xl font-bold text-green-500 dark:text-green-400 flex items-center">
              <span className="relative flex h-3 w-3 mr-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
              Connected
            </p>
            <div className={`mt-2 text-sm ${darkMode ? 'text-yellow-400' : 'text-yellow-600'} flex items-center`}>
              <Plug className="w-4 h-4 mr-2" />
              <span>Active connection</span>
            </div>
          </div>
        </div>

        {/* Tables */}
        <main>
          {filteredTableNames.length > 0 ? (
            filteredTableNames.map((tableName, index) => {
              const table = tables[tableName];
              const columns = table.headers.map((header: string) => ({
                name: header,
                selector: (row: any) => row[header] || 'NULL',
                sortable: true,
                wrap: true,
                maxWidth: '200px',
              }));

              return (
                <div
                  key={index}
                  className={`mb-8 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border overflow-hidden`}
                  data-testid={`datatable-${index}`}
                >
                  {/* Table Header */}
                  <div className={`px-6 py-4 flex justify-between items-center ${darkMode ? 'bg-gray-700/50 border-gray-700' : 'bg-gray-50 border-gray-100'} border-b`}>
                    <div>
                      <h2 className={`text-xl font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-800'} flex items-center`}>
                        <TableIcon className={`w-5 h-5 mr-3 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
                        <span>{tableName}</span>
                        <span className={`ml-2 px-2 py-1 text-xs rounded-full ${darkMode ? 'bg-indigo-900/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}>
                          {table.total} records
                        </span>
                      </h2>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                        {table.headers.length} columns • Last updated: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setExportModal({
                          open: true,
                          tableName,
                          loading: false,
                          activeFormat: null
                        })}
                        data-testid={`export-button-${index}`}
                        className={`px-4 py-2 ${darkMode ? 'bg-indigo-900/10 text-indigo-400 hover:bg-indigo-900/20' : 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'} rounded-lg text-sm font-medium transition-all duration-300 flex items-center`}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Export
                      </button>
                      <button className={`px-4 py-2 ${darkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} rounded-lg text-sm font-medium transition-all duration-300 flex items-center`}>
                        <Search className="w-4 h-4 mr-2" />
                        Query
                      </button>
                    </div>
                  </div>

                  {/* Table Content */}
                  <div className="p-1">
                    <div className="overflow-x-auto rounded-lg">
                      <DataTable
                        columns={columns}
                        data={table.rows}
                        //customStyles={customStyles}
                        pagination
                        paginationPerPage={10}
                        paginationRowsPerPageOptions={[10, 25, 50, 100]}
                        highlightOnHover
                        responsive
                        theme={darkMode ? 'dark' : 'light'}
                      />
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-16">
              <div className={`inline-block p-6 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-xl shadow-sm border`}>
                <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${darkMode ? 'bg-indigo-900/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'} opacity-50`}>
                  <Search className="w-8 h-8" />
                </div>
                <h3 className={`text-xl font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>No matching tables found</h3>
                <p className="mb-4">
                  Your search for "<span className={`font-medium ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>{searchQuery}</span>" didn't match any tables.
                </p>
                <button
                  onClick={() => setSearchQuery('')}
                  className={`px-4 py-2 ${darkMode ? 'bg-indigo-900/10 text-indigo-400 hover:bg-indigo-900/20' : 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'} rounded-lg transition`}
                >
                  Clear search
                </button>
              </div>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className={`mt-16 pt-8 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'} text-sm`}>

        </footer>
      </div>

      {/* Export Modal */}
      {exportModal.open && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}


            {/* Modal content */}
            <div
              className={`inline-block align-bottom rounded-xl shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full ${darkMode ? 'bg-gray-800' : 'bg-white'}`}
            >
              <div className={`px-6 py-5 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <h3 className={`text-lg font-medium ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                    <span className="inline-flex items-center">
                      <Download className={`w-5 h-5 mr-2 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
                      Export Table Data
                    </span>
                  </h3>
                  <button
                    onClick={() => setExportModal(prev => ({ ...prev, open: false }))}
                    className={`${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-500'} focus:outline-none`}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <p className={`mt-1 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Export "<span className="font-medium">{exportModal.tableName}</span>" in your preferred format
                </p>
              </div>

              <div className="px-6 py-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* CSV Card */}
                  <div
                    onClick={() => setExportModal(prev => ({ ...prev, activeFormat: 'CSV' }))}
                    data-testid={`export-card-CSV`}
                    className={`border rounded-lg p-4 cursor-pointer transition-all duration-300 ${darkMode ? 'bg-gray-800' : 'bg-white'} ${exportModal.activeFormat === 'CSV'
                      ? `${darkMode ? 'border-blue-500 bg-blue-900/20 ring-2 ring-blue-500/30' : 'border-blue-500 bg-blue-50 ring-2 ring-blue-500/30'}`
                      : `${darkMode ? 'border-gray-700 hover:border-blue-500 hover:bg-blue-900/10 hover:ring-2 hover:ring-blue-500/30' : 'border-gray-200 hover:border-blue-500 hover:bg-blue-50/50 hover:ring-2 hover:ring-blue-500/30'}`
                      }`}
                  >
                    <div className="flex flex-col items-center text-center">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-colors ${exportModal.activeFormat === 'CSV'
                          ? `${darkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-600'}`
                          : `${darkMode ? 'bg-gray-700 text-gray-400 hover:bg-blue-900/30 hover:text-blue-400' : 'bg-gray-100 text-gray-500 hover:bg-blue-100 hover:text-blue-600'}`
                          }`}
                      >
                        <FileText className="w-5 h-5" />
                      </div>
                      <h4
                        className={`font-medium mb-1 ${exportModal.activeFormat === 'CSV'
                          ? `${darkMode ? 'text-blue-400' : 'text-blue-600'}`
                          : `${darkMode ? 'text-gray-100' : 'text-gray-900'}`
                          }`}
                      >
                        CSV
                      </h4>
                      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Comma-separated values
                      </p>
                    </div>
                  </div>

                  {/* JSON Card */}
                  <div
                    onClick={() => setExportModal(prev => ({ ...prev, activeFormat: 'JSON' }))}
                    data-testid={`export-card-JSON`}
                    className={`border rounded-lg p-4 cursor-pointer transition-all duration-300 ${darkMode ? 'bg-gray-800' : 'bg-white'} ${exportModal.activeFormat === 'JSON'
                      ? `${darkMode ? 'border-purple-500 bg-purple-900/20 ring-2 ring-purple-500/30' : 'border-purple-500 bg-purple-50 ring-2 ring-purple-500/30'}`
                      : `${darkMode ? 'border-gray-700 hover:border-purple-500 hover:bg-purple-900/10 hover:ring-2 hover:ring-purple-500/30' : 'border-gray-200 hover:border-purple-500 hover:bg-purple-50/50 hover:ring-2 hover:ring-purple-500/30'}`
                      }`}
                  >
                    <div className="flex flex-col items-center text-center">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-colors ${exportModal.activeFormat === 'JSON'
                          ? `${darkMode ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-100 text-purple-600'}`
                          : `${darkMode ? 'bg-gray-700 text-gray-400 hover:bg-purple-900/30 hover:text-purple-400' : 'bg-gray-100 text-gray-500 hover:bg-purple-100 hover:text-purple-600'}`
                          }`}
                      >
                        <FileCode className="w-5 h-5" />
                      </div>
                      <h4
                        className={`font-medium mb-1 ${exportModal.activeFormat === 'JSON'
                          ? `${darkMode ? 'text-purple-400' : 'text-purple-600'}`
                          : `${darkMode ? 'text-gray-100' : 'text-gray-900'}`
                          }`}
                      >
                        JSON
                      </h4>
                      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        JavaScript Object Notation
                      </p>
                    </div>
                  </div>

                  {/* Excel Card */}
                  <div
                    onClick={() => setExportModal(prev => ({ ...prev, activeFormat: 'Excel' }))}
                    data-testid={`export-card-Excel`}
                    className={`border rounded-lg p-4 cursor-pointer transition-all duration-300 ${darkMode ? 'bg-gray-800' : 'bg-white'} ${exportModal.activeFormat === 'Excel'
                      ? `${darkMode ? 'border-green-500 bg-green-900/20 ring-2 ring-green-500/30' : 'border-green-500 bg-green-50 ring-2 ring-green-500/30'}`
                      : `${darkMode ? 'border-gray-700 hover:border-green-500 hover:bg-green-900/10 hover:ring-2 hover:ring-green-500/30' : 'border-gray-200 hover:border-green-500 hover:bg-green-50/50 hover:ring-2 hover:ring-green-500/30'}`
                      }`}
                  >
                    <div className="flex flex-col items-center text-center">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-colors ${exportModal.activeFormat === 'Excel'
                          ? `${darkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-600'}`
                          : `${darkMode ? 'bg-gray-700 text-gray-400 hover:bg-green-900/30 hover:text-green-400' : 'bg-gray-100 text-gray-500 hover:bg-green-100 hover:text-green-600'}`
                          }`}
                      >
                        <FileSpreadsheet className="w-5 h-5" />
                      </div>
                      <h4
                        className={`font-medium mb-1 ${exportModal.activeFormat === 'Excel'
                          ? `${darkMode ? 'text-green-400' : 'text-green-600'}`
                          : `${darkMode ? 'text-gray-100' : 'text-gray-900'}`
                          }`}
                      >
                        Excel
                      </h4>
                      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Microsoft Excel format
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className={`px-6 py-4 ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'} rounded-b-xl flex justify-end space-x-3`}>
                <button
                  onClick={() => setExportModal(prev => ({ ...prev, open: false }))}
                  className={`px-4 py-2 ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'} border rounded-lg transition`}
                >
                  Cancel
                </button>
                <button
                  onClick={() => exportModal.activeFormat && handleExport(exportModal.activeFormat)}
                  disabled={!exportModal.activeFormat || exportModal.loading}
                  className={`px-4 py-2 text-white rounded-lg transition ${exportModal.activeFormat && !exportModal.loading
                    ? `${darkMode ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-indigo-600 hover:bg-indigo-700'}`
                    : `${darkMode ? 'bg-gray-600 cursor-not-allowed' : 'bg-gray-300 cursor-not-allowed'}`
                    }`}
                >
                  {exportModal.loading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Exporting...
                    </span>
                  ) : (
                    'Download'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}