import { Select } from "antd";
import Image from "next/image";

const SelectBox = ({
  styleClass,
  placeholder,
  onSelect,
  optionsList,
  value,
  maxLength,
  allowClear,
  showArrow,
  suffixIcon,
  onChange,
  onSearch,
  searchValue,
  onBlur,
  ariaLabel,
}) => {
  return (
    <div className="ln-head-dropdown">
      <Select
        onBlur={onBlur}
        searchValue={searchValue}
        suffixIcon={suffixIcon}
        showArrow={showArrow ? true : false}
        value={value}
        showSearch
        maxLength={maxLength ? maxLength : 5}
        placeholder={placeholder}
        aria-label={ariaLabel || placeholder || "Select option"}
        optionFilterProp="children"
        onSelect={onSelect}
        onSearch={onSearch}
        onChange={onChange}
        bordered
        className={styleClass}
        allowClear={allowClear ? true : false}
        filterOption={(input, option) =>
          (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
        }
        options={optionsList}
      />
    </div>
  );
};

export default SelectBox;
