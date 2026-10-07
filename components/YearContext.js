'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

const YearContext = createContext({
  selectedYear: 2024,
  setSelectedYear: () => {},
  availableYears: [],
  loadingYears: false,
  refreshYears: () => {},
});

export const ELECTION_YEARS_META = {
  2024: {
    label: '2024 General Elections',
    type: 'Lok Sabha',
    badge: '2024 LS',
    color: 'emerald',
    description: 'Parliamentary General Elections (Form 20)',
  },
  2022: {
    label: '2022 Assembly Elections',
    type: 'Vidhan Sabha',
    badge: '2022 VS',
    color: 'blue',
    description: 'State Legislative Assembly Elections',
  },
  2019: {
    label: '2019 General Elections',
    type: 'Lok Sabha',
    badge: '2019 LS',
    color: 'purple',
    description: 'Parliamentary General Elections (Form 20)',
  },
  2017: {
    label: '2017 Assembly Elections',
    type: 'Vidhan Sabha',
    badge: '2017 VS',
    color: 'amber',
    description: 'State Legislative Assembly Elections',
  },
};

export function YearProvider({ children }) {
  const [selectedYear, setSelectedYearState] = useState(2024);
  const [availableYears, setAvailableYears] = useState([
    { year: 2024, label: '2024 General Elections', hasData: true },
    { year: 2022, label: '2022 Assembly Elections', hasData: true },
    { year: 2019, label: '2019 General Elections', hasData: true },
    { year: 2017, label: '2017 Assembly Elections', hasData: true },
  ]);
  const [loadingYears, setLoadingYears] = useState(false);

  // Initialize from localStorage or URL on client mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const yearFromUrl = urlParams.get('year');
      const storedYear = localStorage.getItem('booth_analysis_selected_year');

      if (yearFromUrl && !isNaN(Number(yearFromUrl))) {
        setSelectedYearState(Number(yearFromUrl));
      } else if (storedYear && !isNaN(Number(storedYear))) {
        setSelectedYearState(Number(storedYear));
      }
    }
  }, []);

  const fetchYears = async () => {
    setLoadingYears(true);
    try {
      const res = await fetch('/api/years');
      const json = await res.json();
      if (json.success && json.years) {
        setAvailableYears(json.years);
      }
    } catch (err) {
      console.error('Failed to load election years:', err);
    } finally {
      setLoadingYears(false);
    }
  };

  useEffect(() => {
    fetchYears();
  }, []);

  const setSelectedYear = (year) => {
    const numYear = Number(year);
    if (!isNaN(numYear)) {
      setSelectedYearState(numYear);
      if (typeof window !== 'undefined') {
        localStorage.setItem('booth_analysis_selected_year', String(numYear));
      }
    }
  };

  return (
    <YearContext.Provider
      value={{
        selectedYear,
        setSelectedYear,
        availableYears,
        loadingYears,
        refreshYears: fetchYears,
        meta: ELECTION_YEARS_META[selectedYear] || {
          label: `${selectedYear} Elections`,
          type: 'Election Data',
          badge: `${selectedYear}`,
          color: 'emerald',
          description: 'Booth level election analysis',
        },
      }}
    >
      {children}
    </YearContext.Provider>
  );
}

export function useYear() {
  const context = useContext(YearContext);
  if (!context) {
    throw new Error('useYear must be used within a YearProvider');
  }
  return context;
}
