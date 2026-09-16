<!DOCTYPE html>
<html lang="en" x-data="appData" :class="{ 'dark': darkMode }" class="scroll-smooth">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Database Visualizer</title>
    
    <!-- Tailwind CSS via CDN with custom config -->
    <script src="https://cdn.tailwindcss.com"></script>
    
    <!-- Alpine.js with plugins -->
    <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
    <script defer src="https://cdn.jsdelivr.net/npm/@alpinejs/intersect@3.x.x/dist/cdn.min.js"></script>
    
    <!-- DataTables -->
    <link rel="stylesheet" type="text/css" href="https://cdn.datatables.net/1.11.5/css/jquery.dataTables.css">
    <script type="text/javascript" charset="utf8" src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script type="text/javascript" charset="utf8" src="https://cdn.datatables.net/1.11.5/js/jquery.dataTables.js"></script>
    
    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <!-- Animate.css for smooth animations -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css"/>
    
    <script>
        tailwind.config = {
            darkMode: 'class',
            theme: {
                extend: {
                    colors: {
                        primary: {
                            light: '#4f46e5',
                            dark: '#6366f1'
                        },
                        secondary: {
                            light: '#10b981',
                            dark: '#34d399'
                        },
                        accent: {
                            light: '#f59e0b',
                            dark: '#fbbf24'
                        }
                    },
                    animation: {
                        'fade-in': 'fadeIn 0.3s ease-in-out',
                        'fade-in-up': 'fadeInUp 0.5s ease-out'
                    }
                }
            }
        }

        document.addEventListener('alpine:init', () => {
            Alpine.data('appData', () => ({
                darkMode: false,
                searchQuery: '',
                exportModal: { 
                    open: false, 
                    tableName: '', 
                    loading: false,
                    formats: ['CSV', 'JSON', 'Excel'],
                    activeFormat: null
                },
                downloadExport(tableName, format) {
                    this.exportModal.loading = true;
                    const table = document.querySelector(`#table-${tableName}`);
                    
                    if (!table) {
                        console.error('Table not found');
                        this.exportModal.loading = false;
                        return;
                    }
                    
                    const headers = Array.from(table.querySelectorAll('thead th')).map(th => th.textContent.trim());
                    const rows = Array.from(table.querySelectorAll('tbody tr')).map(tr => 
                        Array.from(tr.querySelectorAll('td')).map(td => td.textContent.trim())
                    );
                    
                    let data, mimeType, fileExtension;
                    
                    switch(format) {
                        case 'CSV':
                            const csvHeaders = headers.map(h => `"${h.replace(/"/g, '""')}"`).join(',');
                            const csvRows = rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','));
                            data = [csvHeaders, ...csvRows].join('\r\n');
                            mimeType = 'text/csv;charset=utf-8;';
                            fileExtension = 'csv';
                            break;
                            
                        case 'JSON':
                            const jsonData = rows.map(row => {
                                const obj = {};
                                headers.forEach((header, i) => obj[header] = row[i]);
                                return obj;
                            });
                            data = JSON.stringify(jsonData, null, 2);
                            mimeType = 'application/json';
                            fileExtension = 'json';
                            break;
                            
                        case 'Excel':
                            const excelHeaders = headers.map(h => `"${h.replace(/"/g, '""')}"`).join('\t');
                            const excelRows = rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join('\t'));
                            data = [excelHeaders, ...excelRows].join('\r\n');
                            mimeType = 'application/vnd.ms-excel';
                            fileExtension = 'xls';
                            break;
                            
                        default:
                            console.error('Unsupported format');
                            this.exportModal.loading = false;
                            return;
                    }
                    
                    const blob = new Blob(["\uFEFF" + data], { type: mimeType });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${tableName}.${fileExtension}`;
                    document.body.appendChild(a);
                    a.click();
                    
                    setTimeout(() => {
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                        this.exportModal.loading = false;
                        this.exportModal.open = false;
                    }, 100);
                },
                initDataTables() {
                    // Initialize DataTables for all tables
                    document.querySelectorAll('.data-table').forEach(table => {
                        $(table).DataTable({
                            dom: '<"flex flex-col md:flex-row md:items-center md:justify-between"<"mb-4 md:mb-0"l><"flex flex-col sm:flex-row gap-2"fB>>rt<"flex flex-col md:flex-row md:items-center md:justify-between"<"mb-4 md:mb-0"i><"flex gap-2"p>>',
                            buttons: [
                                {
                                    extend: 'colvis',
                                    text: '<i class="fas fa-eye mr-1"></i> Columns',
                                    className: 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 px-3 py-1.5 rounded text-gray-700 dark:text-gray-200'
                                }
                            ],
                            lengthMenu: [10, 25, 50, 100],
                            pageLength: 10,
                            responsive: true,
                            language: {
                                search: '<i class="fas fa-search mr-2"></i>',
                                searchPlaceholder: 'Search records...',
                                lengthMenu: 'Show _MENU_ entries',
                                info: 'Showing _START_ to _END_ of _TOTAL_ entries',
                                paginate: {
                                    first: '<i class="fas fa-angle-double-left"></i>',
                                    previous: '<i class="fas fa-angle-left"></i>',
                                    next: '<i class="fas fa-angle-right"></i>',
                                    last: '<i class="fas fa-angle-double-right"></i>'
                                }
                            },
                            initComplete: function() {
                                // Add custom classes to elements
                                $('.dataTables_filter input').addClass('bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-light dark:focus:ring-primary-dark focus:border-transparent');
                                $('.dataTables_length select').addClass('bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-light dark:focus:ring-primary-dark focus:border-transparent');
                            }
                        });
                    });
                }
            }));
        });
    </script>
    
    <style>
        /* Custom scrollbar */
        ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
        }
        ::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.05);
        }
        ::-webkit-scrollbar-thumb {
            background: rgba(0, 0, 0, 0.2);
            border-radius: 4px;
        }
        .dark ::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.2);
        }
        
        /* Table styling */
        .dataTables_wrapper .dataTables_filter input {
            margin-left: 0.5em;
        }
        
        .dataTables_wrapper .dataTables_paginate .paginate_button {
            border: 1px solid transparent;
            padding: 0.25rem 0.75rem;
            margin-left: 2px;
            border-radius: 0.375rem;
        }
        
        .dataTables_wrapper .dataTables_paginate .paginate_button:hover {
            background: rgb(226 232 240 / var(--tw-bg-opacity));
            border-color: rgb(203 213 225 / var(--tw-border-opacity));
        }
        
        .dataTables_wrapper .dataTables_paginate .paginate_button.current {
            background: rgb(79 70 229 / var(--tw-bg-opacity));
            color: white !important;
            border-color: rgb(79 70 229 / var(--tw-border-opacity));
        }
        
        .dark .dataTables_wrapper .dataTables_paginate .paginate_button:hover {
            background: rgb(30 41 59 / var(--tw-bg-opacity));
        }
        
        .dark .dataTables_wrapper .dataTables_paginate .paginate_button.current {
            background: rgb(99 102 241 / var(--tw-bg-opacity));
            border-color: rgb(99 102 241 / var(--tw-border-opacity));
        }
        
        /* Card hover effect */
        .card-hover {
            transition: all 0.3s ease;
        }
        .card-hover:hover {
            transform: translateY(-3px);
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        }
        .dark .card-hover:hover {
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2);
        }
        
        /* Gradient background for stats */
        .stat-gradient {
            background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
        }
        .dark .stat-gradient {
            background: linear-gradient(135deg, #6366f1 0%, #818cf8 100%);
        }
    </style>
</head>
<body class="bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 min-h-screen transition-colors duration-300 antialiased" x-init="initDataTables()">
    <div class="container mx-auto px-4 py-8 max-w-7xl">
        <!-- Header -->
        <header class="flex justify-between items-center mb-10 animate-fade-in-up">
            <div>
                <h1 class="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary-light to-primary-dark dark:from-primary-dark dark:to-primary-light bg-clip-text text-transparent">
                    <i class="fas fa-database mr-2"></i>Database Visualizer
                </h1>
                <p class="text-gray-500 dark:text-gray-400 mt-1">Explore and interact with your database tables</p>
            </div>
            <div class="flex items-center space-x-4">
                <button 
                    @click="darkMode = !darkMode"
                    class="p-2 rounded-full bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-all duration-300 group"
                    :title="darkMode ? 'Switch to light mode' : 'Switch to dark mode'"
                >
                    <i x-show="!darkMode" class="fas fa-moon text-gray-500 group-hover:text-primary-light transition-colors"></i>
                    <i x-show="darkMode" class="fas fa-sun text-gray-400 group-hover:text-accent-dark transition-colors"></i>
                </button>
            </div>
        </header>

        <!-- Main Content -->
        <main>
            <!-- Search Bar -->
            <div class="mb-8 animate-fade-in-up" style="animation-delay: 0.1s">
                <div class="relative max-w-2xl mx-auto">
                    <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <i class="fas fa-search text-gray-400"></i>
                    </div>
                    <input 
                        x-model="searchQuery"
                        type="text" 
                        class="block w-full pl-12 pr-10 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-light dark:focus:ring-primary-dark focus:border-transparent shadow-sm transition-all duration-300 hover:shadow-md" 
                        placeholder="Search tables..."
                    >
                    <div x-show="searchQuery" class="absolute inset-y-0 right-0 flex items-center pr-3">
                        <button @click="searchQuery = ''" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 rounded-full">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Stats Overview -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
                <div 
                    x-intersect="$el.classList.add('animate-fade-in-up')"
                    class="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 dark:border-gray-700 overflow-hidden relative"
                >
                    <div class="absolute top-0 right-0 w-16 h-16 rounded-bl-full stat-gradient opacity-10"></div>
                    <h3 class="font-medium text-gray-500 dark:text-gray-400 mb-1">Tables Loaded</h3>
                    <p class="text-3xl font-bold">{{ count($tables) }}</p>
                    <div class="mt-2 text-sm text-primary-light dark:text-primary-dark flex items-center">
                        <i class="fas fa-table mr-2"></i>
                        <span>View all tables</span>
                    </div>
                </div>
                
                <div 
                    x-intersect="$el.classList.add('animate-fade-in-up')"
                    style="animation-delay: 0.1s"
                    class="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 dark:border-gray-700 overflow-hidden relative"
                >
                    <div class="absolute top-0 right-0 w-16 h-16 rounded-bl-full bg-gradient-to-r from-secondary-light to-secondary-dark opacity-10"></div>
                    <h3 class="font-medium text-gray-500 dark:text-gray-400 mb-1">Total Records</h3>
                    <p class="text-3xl font-bold">
                        {{ array_reduce($tables, function($carry, $table) { 
                            return $carry + ($table['total'] ?? 0); 
                        }, 0) }}
                    </p>
                    <div class="mt-2 text-sm text-secondary-light dark:text-secondary-dark flex items-center">
                        <i class="fas fa-layer-group mr-2"></i>
                        <span>Across all tables</span>
                    </div>
                </div>
                
                <div 
                    x-intersect="$el.classList.add('animate-fade-in-up')"
                    style="animation-delay: 0.2s"
                    class="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 dark:border-gray-700 overflow-hidden relative"
                >
                    <div class="absolute top-0 right-0 w-16 h-16 rounded-bl-full bg-gradient-to-r from-accent-light to-accent-dark opacity-10"></div>
                    <h3 class="font-medium text-gray-500 dark:text-gray-400 mb-1">Database Status</h3>
                    <p class="text-3xl font-bold text-green-500 dark:text-green-400 flex items-center">
                        <span class="relative flex h-3 w-3 mr-2">
                            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span class="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                        </span>
                        Connected
                    </p>
                    <div class="mt-2 text-sm text-accent-light dark:text-accent-dark flex items-center">
                        <i class="fas fa-plug mr-2"></i>
                        <span>Active connection</span>
                    </div>
                </div>
            </div>

            <!-- Tables -->
            @foreach($tables as $tableName => $table)
            <div 
                x-show="searchQuery === '' || '{{ $tableName }}'.toLowerCase().includes(searchQuery.toLowerCase())"
                x-intersect="$el.classList.add('animate-fade-in')"
                class="mb-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 dark:border-gray-700 overflow-hidden"
                style="animation-delay: {{ $loop->index * 0.05 }}s"
            >
                <div class="px-6 py-4 flex justify-between items-center bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
                    <div>
                        <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-100 flex items-center">
                            <i class="fas fa-table mr-3 text-primary-light dark:text-primary-dark"></i>
                            <span>{{ $tableName }}</span>
                            <span class="ml-2 px-2 py-1 text-xs rounded-full bg-primary-light/10 dark:bg-primary-dark/10 text-primary-light dark:text-primary-dark">
                                {{ $table['total'] ?? 0 }} records
                            </span>
                        </h2>
                        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {{ count($table['headers'] ?? []) }} columns • Last updated: {{ date('M j, Y') }}
                        </p>
                    </div>
                    <div class="flex space-x-2">
                        <button 
                            @click="exportModal.open = true; exportModal.tableName = '{{ $tableName }}'; exportModal.activeFormat = null"
                            class="px-4 py-2 bg-primary-light/10 dark:bg-primary-dark/10 text-primary-light dark:text-primary-dark rounded-lg text-sm font-medium hover:bg-primary-light/20 dark:hover:bg-primary-dark/20 transition-all duration-300 flex items-center"
                        >
                            <i class="fas fa-download mr-2"></i> Export
                        </button>
                        <button class="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-300 flex items-center">
                            <i class="fas fa-search mr-2"></i> Query
                        </button>
                    </div>
                </div>

                @if(isset($table['error']))
                    <div class="p-6 text-red-500 dark:text-red-400 bg-red-50/50 dark:bg-red-900/10 flex items-start">
                        <i class="fas fa-exclamation-circle mt-1 mr-3"></i>
                        <div>
                            <strong class="font-medium">Error loading table data:</strong>
                            <p class="mt-1">{{ $table['error'] }}</p>
                        </div>
                    </div>
                @else
                    <div class="p-1">
                        <div class="overflow-x-auto rounded-lg">
                            <table id="table-{{ $tableName }}" class="data-table min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead class="bg-gray-50 dark:bg-gray-700/50">
                                    <tr>
                                        @foreach($table['headers'] as $header)
                                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                <div class="flex items-center justify-between">
                                                    <span>{{ $header }}</span>
                                                </div>
                                            </th>
                                        @endforeach
                                    </tr>
                                </thead>
                                <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    @foreach($table['rows'] as $row)
                                        <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                            @foreach($table['headers'] as $header)
                                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                                    <div class="truncate max-w-xs">
                                                        {{ $row->{$header} ?? 'NULL' }}
                                                    </div>
                                                </td>
                                            @endforeach
                                        </tr>
                                    @endforeach
                                </tbody>
                            </table>
                        </div>
                    </div>
                @endif
            </div>
            @endforeach

            <!-- No results message -->
            <div 
                x-show="searchQuery !== '' && Array.from(document.querySelectorAll('[x-show*=\"includes(searchQuery.toLowerCase())\"]')).every(el => el.style.display === 'none')"
                class="text-center py-16 text-gray-500 dark:text-gray-400 animate-fade-in"
            >
                <div class="inline-block p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <i class="fas fa-search fa-3x mb-4 text-primary-light dark:text-primary-dark opacity-50"></i>
                    <h3 class="text-xl font-medium text-gray-700 dark:text-gray-300 mb-2">No matching tables found</h3>
                    <p class="mb-4">Your search for "<span x-text="searchQuery" class="font-medium text-primary-light dark:text-primary-dark"></span>" didn't match any tables.</p>
                    <button @click="searchQuery = ''" class="px-4 py-2 bg-primary-light/10 dark:bg-primary-dark/10 text-primary-light dark:text-primary-dark rounded-lg hover:bg-primary-light/20 dark:hover:bg-primary-dark/20 transition">
                        Clear search
                    </button>
                </div>
            </div>
        </main>

        <!-- Footer -->
        <footer class="mt-16 pt-8 border-t border-gray-200 dark:border-gray-700 text-center text-gray-500 dark:text-gray-400 text-sm animate-fade-in">
            <div class="flex justify-center space-x-6 mb-4">
                <a href="#" class="hover:text-primary-light dark:hover:text-primary-dark transition"><i class="fab fa-github"></i></a>
                <a href="#" class="hover:text-primary-light dark:hover:text-primary-dark transition"><i class="fab fa-twitter"></i></a>
                <a href="#" class="hover:text-primary-light dark:hover:text-primary-dark transition"><i class="fas fa-envelope"></i></a>
            </div>
            <p>Database Visualizer Pro • {{ date('Y') }} • <a href="#" class="text-primary-light dark:text-primary-dark hover:underline">Documentation</a></p>
        </footer>
    </div>

<!-- Export Modal -->
<div 
    x-show="exportModal.open" 
    x-transition:enter="ease-out duration-300"
    x-transition:enter-start="opacity-0"
    x-transition:enter-end="opacity-100"
    x-transition:leave="ease-in duration-200"
    x-transition:leave-start="opacity-100"
    x-transition:leave-end="opacity-0"
    class="fixed inset-0 z-50 overflow-y-auto"
>
    <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <!-- Background overlay -->
        <div 
            x-show="exportModal.open" 
            @click="exportModal.open = false"
            class="fixed inset-0 transition-opacity" 
            aria-hidden="true"
        >
            <div class="absolute inset-0 bg-gray-500 dark:bg-gray-900 opacity-75"></div>
        </div>

        <!-- Modal content -->
        <div 
            x-show="exportModal.open"
            x-transition:enter="ease-out duration-300"
            x-transition:enter-start="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            x-transition:enter-end="opacity-100 translate-y-0 sm:scale-100"
            x-transition:leave="ease-in duration-200"
            x-transition:leave-start="opacity-100 translate-y-0 sm:scale-100"
            x-transition:leave-end="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            class="inline-block align-bottom bg-white dark:bg-gray-800 rounded-xl shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
        >
            <div class="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
                <div class="flex items-center justify-between">
                    <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100">
                        <i class="fas fa-download mr-2 text-primary-light dark:text-primary-dark"></i>
                        Export Table Data
                    </h3>
                    <button 
                        @click="exportModal.open = false"
                        class="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none"
                    >
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Export "<span x-text="exportModal.tableName" class="font-medium"></span>" in your preferred format
                </p>
            </div>
            
            <div class="px-6 py-5">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <!-- CSV Card (Blue) -->
                    <div 
                        @click="exportModal.activeFormat = 'CSV';"
                        :class="{
                            'border-blue-500 bg-blue-50/50 dark:bg-blue-900/10 ring-2 ring-blue-500/30': exportModal.activeFormat === 'CSV',
                            'border-gray-200 dark:border-gray-700 hover:border-blue-500 hover:bg-blue-50/30 dark:hover:bg-blue-900/5 hover:ring-2 hover:ring-blue-500/30': exportModal.activeFormat !== 'CSV'
                        }"
                        class="card-hover border rounded-lg p-4 cursor-pointer transition-all duration-300 bg-white dark:bg-gray-800"
                    >
                        <div class="flex flex-col items-center text-center">
                            <div 
                                :class="{
                                    'bg-blue-100 dark:bg-blue-900/30 text-blue-500 dark:text-blue-400': exportModal.activeFormat === 'CSV',
                                    'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-500 dark:hover:text-blue-400': exportModal.activeFormat !== 'CSV'
                                }"
                                class="w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-colors"
                            >
                                <i class="fas fa-file-csv text-xl"></i>
                            </div>
                            <h4 
                                :class="{
                                    'text-blue-600 dark:text-blue-400': exportModal.activeFormat === 'CSV',
                                    'text-gray-900 dark:text-gray-100': exportModal.activeFormat !== 'CSV'
                                }"
                                class="font-medium mb-1 transition-colors"
                            >
                                CSV
                            </h4>
                            <p class="text-xs text-gray-500 dark:text-gray-400">
                                Comma-separated values
                            </p>
                        </div>
                    </div>
                    
                    <!-- JSON Card (Purple) -->
                    <div 
                        @click="exportModal.activeFormat = 'JSON';"
                        :class="{
                            'border-purple-500 bg-purple-50/50 dark:bg-purple-900/10 ring-2 ring-purple-500/30': exportModal.activeFormat === 'JSON',
                            'border-gray-200 dark:border-gray-700 hover:border-purple-500 hover:bg-purple-50/30 dark:hover:bg-purple-900/5 hover:ring-2 hover:ring-purple-500/30': exportModal.activeFormat !== 'JSON'
                        }"
                        class="card-hover border rounded-lg p-4 cursor-pointer transition-all duration-300 bg-white dark:bg-gray-800"
                    >
                        <div class="flex flex-col items-center text-center">
                            <div 
                                :class="{
                                    'bg-purple-100 dark:bg-purple-900/30 text-purple-500 dark:text-purple-400': exportModal.activeFormat === 'JSON',
                                    'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-purple-100 dark:hover:bg-purple-900/30 hover:text-purple-500 dark:hover:text-purple-400': exportModal.activeFormat !== 'JSON'
                                }"
                                class="w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-colors"
                            >
                                <i class="fas fa-file-code text-xl"></i>
                            </div>
                            <h4 
                                :class="{
                                    'text-purple-600 dark:text-purple-400': exportModal.activeFormat === 'JSON',
                                    'text-gray-900 dark:text-gray-100': exportModal.activeFormat !== 'JSON'
                                }"
                                class="font-medium mb-1 transition-colors"
                            >
                                JSON
                            </h4>
                            <p class="text-xs text-gray-500 dark:text-gray-400">
                                JavaScript Object Notation
                            </p>
                        </div>
                    </div>
                    
                    <!-- Excel Card (Green) -->
                    <div 
                        @click="exportModal.activeFormat = 'Excel';"
                        :class="{
                            'border-green-500 bg-green-50/50 dark:bg-green-900/10 ring-2 ring-green-500/30': exportModal.activeFormat === 'Excel',
                            'border-gray-200 dark:border-gray-700 hover:border-green-500 hover:bg-green-50/30 dark:hover:bg-green-900/5 hover:ring-2 hover:ring-green-500/30': exportModal.activeFormat !== 'Excel'
                        }"
                        class="card-hover border rounded-lg p-4 cursor-pointer transition-all duration-300 bg-white dark:bg-gray-800"
                    >
                        <div class="flex flex-col items-center text-center">
                            <div 
                                :class="{
                                    'bg-green-100 dark:bg-green-900/30 text-green-500 dark:text-green-400': exportModal.activeFormat === 'Excel',
                                    'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-green-100 dark:hover:bg-green-900/30 hover:text-green-500 dark:hover:text-green-400': exportModal.activeFormat !== 'Excel'
                                }"
                                class="w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-colors"
                            >
                                <i class="fas fa-file-excel text-xl"></i>
                            </div>
                            <h4 
                                :class="{
                                    'text-green-600 dark:text-green-400': exportModal.activeFormat === 'Excel',
                                    'text-gray-900 dark:text-gray-100': exportModal.activeFormat !== 'Excel'
                                }"
                                class="font-medium mb-1 transition-colors"
                            >
                                Excel
                            </h4>
                            <p class="text-xs text-gray-500 dark:text-gray-400">
                                Microsoft Excel format
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 rounded-b-xl flex justify-end space-x-3">
                <button 
                    @click="exportModal.open = false"
                    class="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition"
                >
                    Cancel
                </button>
                <button 
                    @click="if (exportModal.activeFormat) downloadExport(exportModal.tableName, exportModal.activeFormat)"
                    :disabled="!exportModal.activeFormat || exportModal.loading"
                    class="px-4 py-2 text-white rounded-lg transition"
                    :class="{
                        'bg-primary-light dark:bg-primary-dark hover:bg-primary-light/90 dark:hover:bg-primary-dark/90': exportModal.activeFormat && !exportModal.loading,
                        'bg-gray-300 dark:bg-gray-600 cursor-not-allowed': !exportModal.activeFormat || exportModal.loading
                    }"
                >
                    <span x-show="!exportModal.loading">Download</span>
                    <span x-show="exportModal.loading" class="flex items-center">
                        <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Exporting...
                    </span>
                </button>
            </div>
        </div>
    </div>
</div>
</body>
</html>