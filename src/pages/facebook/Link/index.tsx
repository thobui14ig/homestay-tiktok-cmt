import KeepAliveCustom from '../../../components/KeepAliveCustom'
import Link from '../../../components/Link/Link'
import { CrawType } from '../../../shared/interfaces/link'


function index() {
  return (
    <KeepAliveCustom>
      <Link crawType={CrawType.FACEBOOK} />
    </KeepAliveCustom>
  )
}

export default index
