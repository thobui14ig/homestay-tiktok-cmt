import {
  Box,
  Stack,
  useMediaQuery
} from '@mui/material';
import { Button, DatePicker, Form, Input } from 'antd';
import dayjs from 'dayjs';
import { MaterialReactTable, MRT_ColumnDef, useMaterialReactTable } from "material-react-table";
import { useEffect, useMemo, useState } from "react";
import { getComments, IGetCommentParams } from '../../../api/comment.api';
import { useApp } from "../../../common/context/app.context";
import { timeAgo } from '../../../common/utils/time';
import Pagination from '../../../components/Pagination/Pagination';
import { IComment } from '../../../shared/interfaces/comment';

function Comment() {
  const [form] = Form.useForm<IGetCommentParams>()
  const initialValues: IGetCommentParams = {
    startDate: dayjs(),
    endDate: dayjs(),
    keyword: ""
  }
  const { optionsReactTableDefault } = useApp();
  const [comments, setComments] = useState<IComment[] | null>(null);
  const [page, setPage] = useState<number>(0)
  const [pageSize, setPageSize] = useState<number>(50)
  const [totalCount, setTotalCount] = useState<number>(0)

  useEffect(() => {
    (async () => {
      await callApi(initialValues)
    })()
  }, [page, pageSize])

  useEffect(() => {
    const timer = setInterval(() => {
      callApi(form.getFieldsValue())
    }, 10000)

    return () => clearTimeout(timer)
  }, [])

  const redirectFacebook = (url: string) => {
    window.open(url, "_blank") 
  }

  const redirectZalo = (phone: string) => {
    if (!phone) return;
    const zaloWebUrl = `https://zalo.me/${phone}`;
    window.open(zaloWebUrl, "_blank");
    setTimeout(() => {
      window.open(zaloWebUrl, "_blank");
    }, 1000);
  }

  const redirectMessenger = (uid: string) => {
    window.open(`https://m.me/${uid}`, "_blank") 
  }


  const isMobile = useMediaQuery("(max-width:600px)");

  
  const columns = useMemo<MRT_ColumnDef<IComment>[]>(
    () => [
      {
        header: 'Thời gian',
        accessorKey: 'timeCreated',
        size: isMobile ? 120 : 300,
        muiTableBodyCellProps: {
          sx: {
            fontSize: { xs: '10px', sm: '12px', md: '14px' }, 
          },
        },

        Cell: (props) => {
          const timeCreated = String(props.row.original.timeCreated ?? "")
          
          return (
          <Box
            sx={(theme) => ({
              display: 'block',
              [theme.breakpoints.down('sm')]: {
                display: 'flex',
                flexDirection: 'column', // hoặc 'row' nếu muốn nằm ngang
                gap: '2px',
              },
            })}
          >
            <span>{timeCreated}</span>
            <span>({timeAgo(timeCreated)})</span>
          </Box>
          )
        },
      },

      {
        header: 'Message',
        accessorKey: 'message',
        muiTableBodyCellProps: {
          sx: {
            fontSize: { xs: '10px', sm: '12px', md: '14px' }, 
          },
        },
        size: isMobile ? 150 : 400,
      },
      {
        header: 'Phone',
        accessorKey: 'phoneNumber',
        muiTableBodyCellProps: {
          sx: {
            fontSize: { xs: '10px', sm: '12px', md: '14px' }, 
          },
        },
        size: isMobile ? 80 : 100,
      },
      {
        header: 'Nguồn',
        accessorKey: 'link.linkName',
        muiTableBodyCellProps: {
          sx: {
            fontSize: { xs: '10px', sm: '12px', md: '14px' }, 
          },
        },
        size: isMobile ? 150 : 400,
      },
    ],
    [isMobile],
  );

  const table = useMaterialReactTable({
    columns,
    data: comments??[],
    ...optionsReactTableDefault,
    enableBottomToolbar: true,
    initialState: {
      ...optionsReactTableDefault.initialState,
      showGlobalFilter: false,
    },
    state: {
       isLoading: comments ? false : true
    },
    renderTopToolbarCustomActions: () => (
      <div className='flex'>
          <Form
            form={form}
            onFinish={onFinish}
            name='horizontal_login'
            layout='inline'
            className='white-label white-form'
            initialValues={{
              startDate: initialValues.startDate,
              endDate: initialValues.endDate,
              keyword: initialValues.keyword
            }}
          >
            <Form.Item
              label='Từ ngày'
              name='startDate'
            >
              <DatePicker />
            </Form.Item>

            <Form.Item
              label='Đến ngày'
              name='endDate'
            >
              <DatePicker />
            </Form.Item>
            <Form.Item
              label="Keyword"
              name="keyword"
            >
              <Input />
            </Form.Item>
            <Form.Item label={null}>
              <Button
                type='primary'
                htmlType='submit'
              >
                Search
              </Button>
            </Form.Item>
          </Form>
      </div>

    ),
    renderRowActions: (props) => {
      const phone = props.row.original.phoneNumber
      const url = props.row.original.link.linkUrl
      const uid  = props.row.original.uid
      

      return (
        <Box
          sx={(theme) => ({
            display: 'flex',
            gap: '0.5rem',
            [theme.breakpoints.down('sm')]: {
              display: 'flex',
              flexDirection: 'column', // xếp dọc
              gap: 0.5,
              '& > *': {
                marginBottom: '1px',
                fontSize: '12px',    // 👈 giảm font chữ
                padding: '2px 6px',  // 👈 giảm padding
                height: '24px',      // 👈 giảm chiều cao button
              },
 
            },
          })}
        >
          <Button type='primary' onClick={() => redirectFacebook(url)}>Xem</Button>
          <Button className="text-primary" disabled={phone ? false : true} onClick={() => redirectZalo(phone)}>
            Zalo
          </Button>
          <Button className="text-primary" onClick={() => redirectMessenger(uid)}>
            Messenger
          </Button>
        </Box>);
    },
    renderBottomToolbar: () => (
      <Box sx={{ p: 1, display: 'flex', justifyContent: 'flex-end' }}>
        <Pagination
          pageSize={pageSize}
          setPage={setPage}
          setPageSize={setPageSize}
          totalCount={totalCount}
          pageSizeOptions={['50', "100", "200"]}
          setData={setComments}
        />
      </Box>
    ),
  });

  const onFinish = async () => {
    setComments(null)
    return callApi(form.getFieldsValue())
  }

  const callApi = async (values: any) => {
    const { data } = await getComments({ ...values, limit: pageSize, offset: pageSize * (page ? page - 1 : 0)   })
    setComments(data.data)
    setTotalCount(data.totalCount)
  }

  return (
    <Stack gap="1rem">
      <MaterialReactTable table={table}/>

    </Stack>
  );
}

export default Comment