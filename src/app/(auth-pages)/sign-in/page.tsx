import SignInClient from './_components/SignInClient'
import handleOauthSignIn from '@/server/actions/auth/handleOauthSignIn'

const Page = () => {
    return <SignInClient handleOauthSignIn={handleOauthSignIn} />
}

export default Page
