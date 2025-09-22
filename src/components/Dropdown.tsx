import { Select } from 'antd';

interface IDropdownProps {
  data: any[];
  handleChange?: (value: number) => void;
  defaultValue?: any;
  setKey?: boolean;
}

const filterOption = (
  input: string,
  option?: { label: string; value: string },
) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase());

const Dropdown = ({
  data,
  handleChange,
  defaultValue = '',
  setKey = false,
}: IDropdownProps) => {
  const onChange = (value: string) => {
    if (handleChange) {
      handleChange(+value);
    }
  };

  data = data.map((item) => {
    return {
      ...item,
      value: String(item.value),
    };
  });
  defaultValue = String(defaultValue) || '';

  return (
    <Select
      className="z-20 w-full h-10 cursor-pointer"
      showSearch
      optionFilterProp="children"
      onChange={onChange}
      filterOption={filterOption}
      options={data}
      defaultValue={defaultValue}
      key={setKey ? Math.random() * 1000 : null}
    />
  );
};

export default Dropdown;
