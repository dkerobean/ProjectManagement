/* eslint-disable @typescript-eslint/no-unused-vars */
import cn from '../utils/classNames'
import dynamic from 'next/dynamic'
import { useConfig } from '../ConfigProvider'
import { useForm, useFormItem } from '../Form/context'
import { useInputGroup } from '../InputGroup/context'
import { HiChevronDown, HiX } from 'react-icons/hi'
import DefaultOption from './Option'
import Spinner from '../Spinner/Spinner'
import { CONTROL_SIZES } from '../utils/constants'
import type { CommonProps, TypeAttributes } from '../@types/common'
import type {
    Props as ReactSelectProps,
    StylesConfig,
    ClassNamesConfig,
    GroupBase,
} from 'react-select'
import type { AsyncProps } from 'react-select/async'
import type { CreatableProps } from 'react-select/creatable'
import type { Ref, JSX } from 'react'

// Dynamic imports to prevent SSR hydration mismatches
const ReactSelect = dynamic(() => import('react-select'), {
    ssr: false,
    loading: () => (
        <div className="select-loading-placeholder">
            <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-10 rounded border"></div>
        </div>
    )
})

const CreatableSelect = dynamic(() => import('react-select/creatable'), {
    ssr: false,
    loading: () => (
        <div className="select-loading-placeholder">
            <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-10 rounded border"></div>
        </div>
    )
})

const AsyncSelect = dynamic(() => import('react-select/async'), {
    ssr: false,
    loading: () => (
        <div className="select-loading-placeholder">
            <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-10 rounded border"></div>
        </div>
    )
})

const DefaultDropdownIndicator = () => {
    return (
        <div className="select-dropdown-indicator">
            <HiChevronDown />
        </div>
    )
}

interface DefaultClearIndicatorProps {
    innerProps: JSX.IntrinsicElements['div']
    ref: Ref<HTMLElement>
}

const DefaultClearIndicator = ({
    innerProps: { ref, ...restInnerProps },
}: DefaultClearIndicatorProps) => {
    return (
        <div {...restInnerProps} ref={ref}>
            <div className="select-clear-indicator">
                <HiX />
            </div>
        </div>
    )
}

interface DefaultLoadingIndicatorProps {
    selectProps: { themeColor?: string }
}

const DefaultLoadingIndicator = ({
    selectProps,
}: DefaultLoadingIndicatorProps) => {
    const { themeColor } = selectProps
    return (
        <Spinner className={`select-loading-indicatior text-${themeColor}`} />
    )
}

export type SelectProps<
    Option,
    IsMulti extends boolean = false,
    Group extends GroupBase<Option> = GroupBase<Option>,
> = CommonProps &
    ReactSelectProps<Option, IsMulti, Group> &
    AsyncProps<Option, IsMulti, Group> &
    CreatableProps<Option, IsMulti, Group> & {
        invalid?: boolean
        size?: TypeAttributes.ControlSize
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        field?: any
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        componentAs?: any
    }

function Select<
    Option,
    IsMulti extends boolean = false,
    Group extends GroupBase<Option> = GroupBase<Option>,
>(props: SelectProps<Option, IsMulti, Group>) {
    const {
        components,
        componentAs: Component = ReactSelect,
        size,
        styles,
        className,
        classNames,
        field,
        invalid,
        ...rest
    } = props

    const { controlSize } = useConfig()
    const formControlSize = useForm()?.size
    const formItemInvalid = useFormItem()?.invalid
    const inputGroupSize = useInputGroup()?.size

    const selectSize = (size ||
        inputGroupSize ||
        formControlSize ||
        controlSize) as keyof typeof CONTROL_SIZES

    const isSelectInvalid = invalid || formItemInvalid

    const selectClass = cn(`select select-${selectSize}`, className)

    return (
        <Component
            className={selectClass}
            classNames={
                {
                    control: (state) =>
                        cn(
                            'select-control',
                            CONTROL_SIZES[selectSize].minH,
                            state.isDisabled && 'opacity-50 cursor-not-allowed',
                            (() => {
                                const classes: string[] = [
                                    'bg-gray-100 dark:bg-gray-700',
                                ]

                                const { isFocused } = state

                                if (isFocused) {
                                    classes.push(
                                        'select-control-focused ring-1 ring-primary border-primary bg-transparent',
                                    )
                                }

                                if (isSelectInvalid) {
                                    classes.push(
                                        'select-control-invalid bg-error-subtle',
                                    )
                                }

                                if (isFocused && isSelectInvalid) {
                                    classes.push('ring-error border-error')
                                }

                                return classes
                            })(),
                        ),
                    valueContainer: ({ isMulti, hasValue, selectProps }) =>
                        cn(
                            'select-value-container',
                            isMulti &&
                                hasValue &&
                                selectProps.controlShouldRenderValue
                                ? 'flex'
                                : 'grid',
                        ),
                    input: ({ value, isDisabled }) =>
                        cn(
                            'select-input-container',
                            isDisabled ? 'invisible' : 'visible',
                            value && '[transform:translateZ(0)]',
                        ),
                    placeholder: () =>
                        cn(
                            'select-placeholder',
                            isSelectInvalid ? 'text-error' : 'text-gray-400',
                        ),
                    indicatorsContainer: () => 'select-indicators-container',
                    singleValue: () => 'select-single-value',
                    multiValue: () => 'select-multi-value',
                    multiValueLabel: () => 'select-multi-value-label',
                    multiValueRemove: () => 'select-multi-value-remove',
                    menu: () => 'select-menu',                    ...classNames,
                }
            }
            classNamePrefix={'select'}
            styles={
                {
                    control: () => ({}),
                    valueContainer: () => ({}),
                    input: ({
                        margin,
                        paddingTop,
                        paddingBottom,
                        ...provided
                    }) => ({ ...provided }),
                    placeholder: () => ({}),
                    singleValue: () => ({}),
                    multiValue: () => ({}),
                    multiValueLabel: () => ({}),
                    multiValueRemove: () => ({}),
                    menu: ({
                        backgroundColor,
                        marginTop,
                        marginBottom,
                        border,
                        borderRadius,
                        boxShadow,
                        ...provided
                    }) => ({ ...provided, zIndex: 50 }),                    ...styles,
                }
            }
            components={{
                IndicatorSeparator: () => null,
                Option: DefaultOption,
                LoadingIndicator: DefaultLoadingIndicator,
                DropdownIndicator: DefaultDropdownIndicator,
                ClearIndicator: DefaultClearIndicator,
                ...components,
            }}
            {...field}
            {...rest}
        />
    )
}

export default Select
