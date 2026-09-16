import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import React, { useState } from 'react';

interface CourseListHeaderProps {
  searchPlaceholder?: string;
  searchIcon?: React.ReactNode;
  settingsButton?: React.ReactNode;
  onSettingsClick?: () => void;
  archived?: boolean;
  search: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleFilter?: (filter: string) => void;
  router?: AppRouterInstance;
  showBackArrow?: boolean;
}

export default function CourseListHeader({
  archived,
  searchPlaceholder = "Find a course...",
  search,
  handleFilter,
  router,
  showBackArrow,
  onSettingsClick,
  searchIcon = (
    <img
      src="/searchButton.svg"
      alt="Search"
      className="w-[30px] h-[30px] mr-6 -ml-3"
    />
  ),
  settingsButton = (
    <button
      className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center border-none cursor-pointer transition-all duration-200 ease-in-out hover:shadow-md hover:scale-105"
      aria-label="Settings"
      onClick={onSettingsClick || (() => {
        window.location.href = '../settings';
      })}
    >
      <img
        src="/settings.svg"
        alt="Settings"
        className="w-7 h-7 transition-transform duration-400 ease-in-out hover:rotate-30"
      />
    </button>
  )
}: CourseListHeaderProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('Filter by');
  const [hoveredFilter, setHoveredFilter] = useState<string | null>(null);

  const filters = [
    { value: 'code-asc', label: 'Course Code (A-Z)' },
    { value: 'code-desc', label: 'Course Code (Z-A)' },
    { value: 'start-date-asc', label: 'Start Date (Oldest)' },
    { value: 'start-date-desc', label: 'Start Date (Newest)' },
    { value: 'end-date-asc', label: 'End Date (Oldest)' },
    { value: 'end-date-desc', label: 'End Date (Newest)' },
  ];

  return (
    <div className={`flex items-center w-full pb-6 gap-6`}>
      {showBackArrow &&
        <button
          className="bg-white px-2 py-2 rounded-lg cursor-pointer hover:translate-y-[-5px] transition-all duration-200 flex items-center gap-2"
          onClick={() => { router!.back() }}
        >
          <img src="/back-dark-icon.svg" alt="Back" className="w-[20px] h-[20px]" />
        </button>
      }
      <div className="flex items-center lg:ml-10 md:ml-4 ml-2 gap-4">
        {/* Search Input */}
        <div className={`flex items-center ${archived ? 'bg-gray-200' : 'bg-white'} rounded-full px-6 py-2 shadow-sm lg:w-[700px] w-[320px] h-12`}>
          {searchIcon}
          <input
            type="text"
            placeholder={searchPlaceholder}
            className="border-none outline-none bg-transparent text-lg w-full text-[#8E8D93] h-full font-medium"
            onChange={search}
            data-testid="header-search"
            aria-label="Course search input"
          />
        </div>

        {/* Filter Dropdown */}
        {handleFilter &&
          <div className="relative h-12">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="bg-white border-none rounded-full px-6 py-0 shadow-sm flex items-center gap-2 cursor-pointer text-base text-[#8E8D93] h-full font-medium"
              aria-haspopup="listbox"
              aria-expanded={isFilterOpen}
              aria-label="Course filter options"
            >
              {selectedFilter}
              <img
                src="/arrow-down.svg"
                alt="Dropdown indicator"
                className="w-4 h-4 transition-transform duration-200 ease-in-out"
                style={{
                  transform: isFilterOpen ? 'rotate(180deg)' : 'rotate(0deg)'
                }}
              />
            </button>

            {/* Filter Options List */}
            {isFilterOpen && (
              <div
                className="absolute top-[calc(100%+8px)] left-0 bg-white rounded-xl shadow-md py-2 min-w-[200px] z-[100]"
                role="listbox"
              >
                {filters.map((filter) => (
                  <div
                    key={filter.value}
                    onClick={() => {
                      setSelectedFilter(filter.label);
                      setIsFilterOpen(false);
                      handleFilter(filter.value);
                    }}
                    onMouseEnter={() => setHoveredFilter(filter.value)}
                    onMouseLeave={() => setHoveredFilter(null)}
                    className={`px-4 py-3 cursor-pointer text-sm text-[#8E8D93] transition-colors duration-200 ease-in-out ${hoveredFilter === filter.value ? 'bg-gray-100' : 'bg-transparent'
                      }`}
                    role="option"
                    aria-selected={selectedFilter === filter.label}
                  >
                    {filter.label}
                  </div>
                ))}
              </div>
            )}
          </div>
        }
      </div>

      {/* Settings Button */}
      <div className="ml-auto mr-10">
        {settingsButton}
      </div>
    </div>
  );
}