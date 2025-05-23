import React from "react";
import OutlinedInput from "@mui/material/OutlinedInput";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import ListItemText from "@mui/material/ListItemText";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import Checkbox from "@mui/material/Checkbox";
import GenreModel from "../../model/GenreModel";
import DdcCategoryModel from "../../model/DdcCategoryModel";

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
	PaperProps: {
		style: {
			maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
			width: 250,
		},
	},
};

interface SelectMultipleProps {
	values: GenreModel[] | DdcCategoryModel[]; // Giá trị để in ra dữ liệu select
	selectedList: any[]; // Biến dữ liệu đã select
	setSelectedList: any; // Hàm gán dữ liệu đã select
	setValue: any; // Hàm gán lại dữ liệu
	required: boolean; // có bắt buộc chọn không
	selectedListName: any[]; // Biến để lúc chọn thì nó sẽ hiện ra (kiểu tag)
	setSelectedListName: any; // Hàm để gán những gì mình chọn bằng tên
	label?: string; // Label cho select
}

export const SelectMultiple: React.FC<SelectMultipleProps> = (props) => {
	const handleChange = (event: SelectChangeEvent<typeof props.selectedListName>) => {
		const value = event.target.value;

		// Kiểm tra xem values là GenreModel hay DdcCategoryModel
		if (props.values.length > 0 && 'nameGenre' in props.values[0]) {
			// Xử lý cho GenreModel
			const genreValues = props.values as GenreModel[];
			const dataSelected = genreValues.filter((i) =>
				value.includes(i.nameGenre)
			);
			const dataSelectedId = dataSelected.map((i) => i.idGenre);
			props.setSelectedList(dataSelectedId);
		} else if (props.values.length > 0 && 'nameCategory' in props.values[0]) {
			// Xử lý cho DdcCategoryModel
			const ddcCategoryValues = props.values as DdcCategoryModel[];
			const dataSelected = ddcCategoryValues.filter((i) =>
				value.includes(i.nameCategory)
			);
			const dataSelectedId = dataSelected.map((i) => i.idDdcCategory);
			props.setSelectedList(dataSelectedId);
		}

		props.setSelectedListName(
			// On autofill we get a stringified value.
			typeof value === "string" ? value.split(",") : value
		);
	};

	const getDisplayName = (item: GenreModel | DdcCategoryModel): string => {
		if ('nameGenre' in item) {
			return item.nameGenre;
		} else if ('nameCategory' in item) {
			return item.nameCategory;
		}
		return '';
	};

	const getItemKey = (item: GenreModel | DdcCategoryModel): number => {
		if ('idGenre' in item) {
			return item.idGenre;
		} else if ('idDdcCategory' in item) {
			return item.idDdcCategory;
		}
		return 0;
	};

	const labelText = props.label || "Lựa chọn";

	return (
		<div>
			<FormControl sx={{ mb: 3, width: "100%" }} size='small'>
				<InputLabel id='demo-multiple-checkbox-label'>{labelText}</InputLabel>
				<Select
					labelId='demo-multiple-checkbox-label'
					id='demo-multiple-checkbox'
					multiple
					value={Array.from(new Set(props.selectedListName))}
					onChange={handleChange}
					input={<OutlinedInput label={labelText} />}
					renderValue={(selected) => selected.join(", ")}
					MenuProps={MenuProps}
					required={props.required}
				>
					{props.values.map((item) => {
						const displayName = getDisplayName(item);
						const itemKey = getItemKey(item);

						return (
							<MenuItem key={itemKey} value={displayName}>
								<Checkbox
									checked={props.selectedListName.indexOf(displayName) > -1}
								/>
								<ListItemText primary={displayName} />
							</MenuItem>
						);
					})}
				</Select>
			</FormControl>
		</div>
	);
};