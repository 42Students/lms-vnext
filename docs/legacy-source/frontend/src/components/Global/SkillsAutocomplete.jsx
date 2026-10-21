import React, { useState, useEffect, useCallback, useRef } from "react";
import { AutoComplete, Tag, Select, Space, Spin, Typography, Divider, Empty } from "antd";
import { FireOutlined, ClockCircleOutlined, SearchOutlined, StarOutlined } from "@ant-design/icons";
import { searchSkills, getPopularSkills, recordSkillSelection } from "@/api/Services/SkillService";
import { debounce } from "lodash";

const { Option } = Select;
const { Text } = Typography;

// Local storage key for recent skills
const RECENT_SKILLS_KEY = "lms_recent_skills";

/**
 * Enhanced Skills Autocomplete Component
 * Features:
 * - Advanced search with synonym expansion and fuzzy matching
 * - Popular skills suggestions
 * - Recent skills (persisted in localStorage)
 * - Popularity tracking
 * - Category badges
 * - Proficiency selection
 * 
 * @param {Object} props
 * @param {Array} props.value - Array of {skill: string, proficiency: string, skillId?: number} objects
 * @param {Function} props.onChange - Callback when skills change
 * @param {boolean} props.allowProficiency - Show proficiency selector (default: true)
 * @param {string} props.placeholder - Input placeholder text
 * @param {number} props.maxResults - Maximum autocomplete results (default: 15)
 * @param {boolean} props.disabled - Disable the component
 * @param {boolean} props.showPopular - Show popular skills on focus (default: true)
 * @param {boolean} props.showRecent - Show recent skills on focus (default: true)
 */
export default function SkillsAutocomplete({
  value = [],
  onChange,
  allowProficiency = true,
  placeholder = "Type to search skills (e.g., Java, Python, React)...",
  maxResults = 15,
  disabled = false,
  showPopular = true,
  showRecent = true,
}) {
  const [searchValue, setSearchValue] = useState("");
  const [options, setOptions] = useState([]);
  const [popularSkills, setPopularSkills] = useState([]);
  const [recentSkills, setRecentSkills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState(value || []);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef(null);
  const searchErrorRef = useRef(false);

  // Proficiency levels with colors
  const proficiencyLevels = [
    { value: "Beginner", label: "Beginner", color: "#87d068" },
    { value: "Intermediate", label: "Intermediate", color: "#2db7f5" },
    { value: "Advanced", label: "Advanced", color: "#108ee9" },
    { value: "Expert", label: "Expert", color: "#722ed1" },
  ];

  // Category colors
  const categoryColors = {
    "Technical Skills": "blue",
    "Soft Skills": "green",
    "Certifications": "purple",
    "Domain Skills": "orange",
    "General": "default",
  };

  // Load popular skills on mount
  useEffect(() => {
    if (showPopular) {
      loadPopularSkills();
    }
    if (showRecent) {
      loadRecentSkills();
    }
  }, [showPopular, showRecent]);

  const loadPopularSkills = async () => {
    try {
      const response = await getPopularSkills(8);
      if (response?.data?.status === "success" && response?.data?.data) {
        setPopularSkills(response.data.data);
      }
    } catch (error) {
    }
  };

  const loadRecentSkills = () => {
    try {
      const stored = localStorage.getItem(RECENT_SKILLS_KEY);
      if (stored) {
        const recent = JSON.parse(stored);
        setRecentSkills(Array.isArray(recent) ? recent.slice(0, 5) : []);
      }
    } catch (error) {
      setRecentSkills([]);
    }
  };

  const saveRecentSkill = (skill) => {
    try {
      const stored = localStorage.getItem(RECENT_SKILLS_KEY);
      let recent = stored ? JSON.parse(stored) : [];
      
      // Remove if already exists, add to front
      recent = [skill, ...recent.filter(s => s.id !== skill.id)].slice(0, 10);
      
      localStorage.setItem(RECENT_SKILLS_KEY, JSON.stringify(recent));
      setRecentSkills(recent.slice(0, 5));
    } catch (error) {
    }
  };

  // Render section header
  const renderSectionHeader = (title, icon, count) => (
    <div style={{ 
      display: "flex", 
      alignItems: "center", 
      gap: 8, 
      padding: "8px 12px",
      background: "#fafafa",
      borderBottom: "1px solid #f0f0f0",
      cursor: "default"
    }}>
      {icon}
      <Text strong style={{ fontSize: 12, color: "#595959", textTransform: "uppercase", letterSpacing: "0.5px" }}>
        {title}
      </Text>
      {count > 0 && (
        <Text type="secondary" style={{ fontSize: 11 }}>({count})</Text>
      )}
    </div>
  );

  // Format skill option for display
  const formatSkillOption = (skill, type = "search") => {
    const isAlreadySelected = selectedSkills.some(
      s => s.skill === (skill.displayName || skill.name)
    );

    return {
      value: skill.displayName || skill.name,
      disabled: isAlreadySelected,
      label: (
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center",
          padding: "4px 0",
          opacity: isAlreadySelected ? 0.5 : 1
        }}>
          <Space>
            <span style={{ fontWeight: 500 }}>{skill.displayName || skill.name}</span>
            {isAlreadySelected && (
              <Tag color="default" style={{ fontSize: 10, margin: 0 }}>Added</Tag>
            )}
          </Space>
          <Space size={4}>
            {type === "popular" && skill.isPopular && (
              <Tag color="volcano" style={{ fontSize: 10, margin: 0, padding: "0 4px" }}>
                <FireOutlined /> Hot
              </Tag>
            )}
            {type === "recent" && (
              <Tag color="cyan" style={{ fontSize: 10, margin: 0, padding: "0 4px" }}>
                <ClockCircleOutlined /> Recent
              </Tag>
            )}
            {skill.category && (
              <Tag 
                color={categoryColors[skill.category] || "default"} 
                style={{ fontSize: 10, margin: 0 }}
              >
                {skill.category}
              </Tag>
            )}
          </Space>
        </div>
      ),
      skill: skill,
    };
  };

  // Show default suggestions (popular + recent)
  const showDefaultSuggestions = () => {
    const suggestions = [];

    // Add recent skills section
    if (showRecent && recentSkills.length > 0) {
      const recentNotSelected = recentSkills.filter(
        skill => !selectedSkills.some(s => s.skill === (skill.displayName || skill.name))
      );
      
      if (recentNotSelected.length > 0) {
        suggestions.push({
          label: renderSectionHeader("Recent", <ClockCircleOutlined style={{ color: "#13c2c2" }} />, recentNotSelected.length),
          options: recentNotSelected.map(skill => formatSkillOption(skill, "recent"))
        });
      }
    }

    // Add popular skills section
    if (showPopular && popularSkills.length > 0) {
      const popularNotSelected = popularSkills.filter(
        skill => !selectedSkills.some(s => s.skill === (skill.displayName || skill.name))
      );
      
      if (popularNotSelected.length > 0) {
        suggestions.push({
          label: renderSectionHeader("Popular", <FireOutlined style={{ color: "#fa541c" }} />, popularNotSelected.length),
          options: popularNotSelected.map(skill => formatSkillOption(skill, "popular"))
        });
      }
    }

    setOptions(suggestions);
  };

  // Debounced search function (faster for better UX)
  // BE-0174: only the newest skill search may set the options (an older one finishing late is dropped).
  const skillSearchSeq = useRef(0);
  const debouncedSearch = useCallback(
    debounce(async (query) => {
      const seq = ++skillSearchSeq.current;
      if (!query || query.trim().length < 1) {
        showDefaultSuggestions();
        return;
      }

      setLoading(true);
      try {
        const response = await searchSkills(query.trim(), maxResults);
        if (seq !== skillSearchSeq.current) return;
        if (response?.data?.status === "success" && response?.data?.data) {
          const skills = response.data.data;
          
          if (skills.length === 0) {
            searchErrorRef.current = false;
            setOptions([{
              label: renderSectionHeader("No Results", <SearchOutlined style={{ color: "#8c8c8c" }} />, 0),
              options: [{
                value: "__no_results__",
                disabled: true,
                label: (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={`No skills matching "${query}". Try a different search.`}
                    style={{ padding: "16px 0" }}
                  />
                )
              }]
            }]);
          } else {
            setOptions([{
              label: renderSectionHeader("Results", <SearchOutlined style={{ color: "#0a7c88" }} />, skills.length),
              options: skills.map(skill => formatSkillOption(skill, "search"))
            }]);
          }
        } else {
          setOptions([]);
        }
      } catch (error) {
        if (seq !== skillSearchSeq.current) return;
        searchErrorRef.current = true;
        setOptions([{
          label: renderSectionHeader("Search Error", <SearchOutlined style={{ color: "#8c8c8c" }} />, 0),
          options: [{
            value: "__search_error__",
            disabled: true,
            label: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="Failed to search. Please try again."
                style={{ padding: "16px 0" }}
              />
            )
          }]
        }]);
      } finally {
        if (seq === skillSearchSeq.current) setLoading(false);
      }
    }, 200), // Faster debounce for better responsiveness
    [maxResults, selectedSkills, popularSkills, recentSkills]
  );

  // Handle search input change
  const handleSearch = (searchText) => {
    setSearchValue(searchText);
    skillSearchSeq.current += 1;
    if (!searchText || searchText.trim().length === 0) {
      showDefaultSuggestions();
    } else {
      debouncedSearch(searchText);
    }
  };

  // Handle focus - show suggestions
  const handleFocus = () => {
    setIsOpen(true);
    if (!searchValue) {
      showDefaultSuggestions();
    }
  };

  // Handle blur
  const handleBlur = () => {
    setTimeout(() => setIsOpen(false), 200);
  };

  // Handle skill selection
  const handleSelect = (selectedValue, option) => {
    if (selectedValue === "__no_results__") return;
    
    const skillData = option.skill;
    if (!skillData) return;
    
    const skillName = skillData.displayName || skillData.name || selectedValue;

    // Check if skill already exists
    if (selectedSkills.some((s) => s.skill === skillName)) {
      setSearchValue("");
      showDefaultSuggestions();
      return;
    }

    // Record selection for popularity tracking (async, uses skill name now)
    const skillNameNormalized = skillData.name || skillName.toLowerCase();
    recordSkillSelection(skillNameNormalized).catch(() => {});
    saveRecentSkill(skillData);

    // Add new skill
    const newSkill = {
      skill: skillName,
      skillName: skillNameNormalized, // Normalized name for backend
      category: skillData.category,
      proficiency: allowProficiency ? "Intermediate" : undefined,
    };

    const updatedSkills = [...selectedSkills, newSkill];
    setSelectedSkills(updatedSkills);
    setSearchValue("");
    
    // Refresh suggestions after selection
    setTimeout(() => showDefaultSuggestions(), 100);

    if (onChange) {
      onChange(updatedSkills);
    }
  };

  // Handle proficiency change
  const handleProficiencyChange = (skillName, proficiency) => {
    const updatedSkills = selectedSkills.map((s) =>
      s.skill === skillName ? { ...s, proficiency } : s
    );
    setSelectedSkills(updatedSkills);

    if (onChange) {
      onChange(updatedSkills);
    }
  };

  // Handle skill removal
  const handleRemove = (skillName) => {
    const updatedSkills = selectedSkills.filter((s) => s.skill !== skillName);
    setSelectedSkills(updatedSkills);
    
    // Refresh suggestions
    setTimeout(() => {
      if (isOpen && !searchValue) {
        showDefaultSuggestions();
      }
    }, 100);

    if (onChange) {
      onChange(updatedSkills);
    }
  };

  // Sync with external value changes
  useEffect(() => {
    if (value && JSON.stringify(value) !== JSON.stringify(selectedSkills)) {
      setSelectedSkills(value);
    }
  }, [value]);

  // Update suggestions when selected skills change
  useEffect(() => {
    if (isOpen && !searchValue) {
      showDefaultSuggestions();
    }
  }, [selectedSkills, popularSkills, recentSkills]);

  return (
    <div className="skills-autocomplete-container">
      <AutoComplete
        ref={inputRef}
        style={{ width: "100%" }}
        options={options}
        onSearch={handleSearch}
        onSelect={handleSelect}
        onFocus={handleFocus}
        onBlur={handleBlur}
        value={searchValue}
        placeholder={placeholder}
        disabled={disabled}
        open={isOpen && options.length > 0}
        onDropdownVisibleChange={(open) => setIsOpen(open)}
        notFoundContent={
          loading ? (
            <div style={{ textAlign: "center", padding: 20 }}>
              <Spin size="small" />
              <Text type="secondary" style={{ marginLeft: 8 }}>Searching...</Text>
            </div>
          ) : null
        }
        filterOption={false}
        dropdownStyle={{ 
          maxHeight: 400, 
          overflow: "auto",
          boxShadow: "0 3px 6px -4px rgba(0,0,0,.12), 0 6px 16px 0 rgba(0,0,0,.08)"
        }}
        dropdownRender={(menu) => (
          <>
            {menu}
            {!loading && !searchValue && (
              <div style={{ 
                padding: "8px 12px", 
                borderTop: "1px solid #f0f0f0",
                background: "#fafafa",
                fontSize: 11,
                color: "#8c8c8c"
              }}>
                <StarOutlined style={{ marginRight: 4 }} />
                Tip: Try typing abbreviations like &quot;js&quot; or &quot;py&quot;
              </div>
            )}
          </>
        )}
      />

      {/* Display selected skills */}
      {selectedSkills.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <Text type="secondary" style={{ fontSize: 12, marginBottom: 8, display: "block" }}>
            Selected Skills ({selectedSkills.length})
          </Text>
          <Space wrap size={[8, 8]}>
            {selectedSkills.map((skillObj, index) => (
              <Tag
                key={`${skillObj.skill}-${index}`}
                closable={!disabled}
                onClose={() => handleRemove(skillObj.skill)}
                style={{
                  padding: "6px 10px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  borderRadius: 6,
                  background: "#f5f5f5",
                  border: "1px solid #d9d9d9"
                }}
              >
                <span style={{ fontWeight: 500 }}>{skillObj.skill}</span>
                {skillObj.category && (
                  <Tag 
                    color={categoryColors[skillObj.category] || "default"}
                    style={{ fontSize: 10, margin: 0, padding: "0 4px" }}
                  >
                    {skillObj.category}
                  </Tag>
                )}
                {allowProficiency && (
                  <Select
                    value={skillObj.proficiency}
                    onChange={(val) => handleProficiencyChange(skillObj.skill, val)}
                    disabled={disabled}
                    size="small"
                    bordered={false}
                    style={{ 
                      width: 110, 
                      marginLeft: 4,
                      background: "#fff",
                      borderRadius: 4
                    }}
                    onClick={(e) => e.stopPropagation()}
                    dropdownStyle={{ minWidth: 120 }}
                  >
                    {proficiencyLevels.map((level) => (
                      <Option key={level.value} value={level.value}>
                        <span style={{ color: level.color }}>{level.label}</span>
                      </Option>
                    ))}
                  </Select>
                )}
              </Tag>
            ))}
          </Space>
        </div>
      )}

      <style jsx>{`
        .skills-autocomplete-container :global(.ant-select-dropdown-menu-item-group-title) {
          padding: 0 !important;
        }
      `}</style>
    </div>
  );
}


