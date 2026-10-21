import jsonp from "fetch-jsonp";
import qs from "qs";
import { useState } from "react";
import { Select } from "antd";
// import { Input } from "antd";

let timeout;
let currentValue;

// function inputRender(props) {
//   return (
//     <div className="hello">
//       <div>My Custom Text</div>
//       <Search {...props} />
//     </div>
//   );
// }

const SearchInput = props => {
  const [data, setData] = useState([]);
  const [value, setValue] = useState();

  const handleSearch = newValue => {
    if (newValue) {
      props.fetch(newValue, setData);
    } else {
      setData([]);
    }
  };
  const handleChange = newValue => {
    setValue(newValue);
  };

  return (
    <Select
      showSearch
      value={value}
      className="ln-input-search"
      placeholder={props.placeholder}
      aria-label={props.ariaLabel || props.placeholder || "Search"}
      style={props.style}
      defaultActiveFirstOption={false}
      showArrow={false}
      filterOption={false}
      onSearch={handleSearch}
      onChange={handleChange}
      notFoundContent={null}
      options={(data || []).map(d => ({
        value: d.value,
        label: d.text,
      }))}
    />
  );
};

const  search = () => {
  const fetch = (value, callback) => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
    currentValue = value;
    const fake = () => {
      const str = qs.stringify({
        code: "utf-8",
        q: value,
      });
      jsonp(`https://suggest.taobao.com/sug?${str}`)
        .then(response => response.json())
        .then(d => {
          if (currentValue === value) {
            const { result } = d;
            const data = result.map(item => ({
              value: item[0],
              text: item[0],
            }));
            callback(data);
          }
        });
    };
    timeout = setTimeout(fake, 300);
  };

  return (
    <div className="ln-head-dropdown ln-head-dropdown--lg">
      <SearchInput placeholder="Search for anything" fetch={fetch} />
    </div>
  );
};

export default search;
